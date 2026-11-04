# syntax=docker/dockerfile:1

# Install every workspace dependency once. Only manifests are copied here so a
# source-only change does not invalidate the dependency layer.
FROM oven/bun:1.4.4 AS deps
WORKDIR /app
# `prepare` runs `husky`, which has no `.git` in the build context.
ENV HUSKY=0
COPY package.json bun.lock .npmrc ./
COPY apps/merchant-admin/package.json ./apps/merchant-admin/
COPY apps/ops-admin/package.json ./apps/ops-admin/
COPY apps/core-api/package.json ./apps/core-api/
COPY packages/auth/package.json ./packages/auth/
COPY packages/config/package.json ./packages/config/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/i18n/package.json ./packages/i18n/
COPY packages/ui/package.json ./packages/ui/
COPY e2e/package.json ./e2e/
# Each workspace runs `prisma generate` from its `postinstall` hook, so the
# schemas must be present before installing.
COPY apps/merchant-admin/prisma/schema.prisma ./apps/merchant-admin/prisma/
COPY apps/ops-admin/prisma/schema.prisma ./apps/ops-admin/prisma/
COPY apps/core-api/prisma/schema.prisma ./apps/core-api/prisma/
RUN bun install --frozen-lockfile

# Generate Prisma clients and build both Next.js portals. Placeholder env vars
# are only used while building; runtime values come from `.env.docker`.
FROM oven/bun:1.4.4 AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    AUTH_SECRET=build-placeholder \
    OPS_AUTH_SECRET=build-placeholder \
    CORE_API_JWT_SECRET=build-placeholder \
    MERCHANT_DATABASE_URL=postgresql://mtm:mtm@postgres:5432/commerce_merchant?schema=public \
    CORE_DATABASE_URL=postgresql://mtm:mtm@postgres:5432/commerce_core?schema=public \
    OPS_DATABASE_URL=postgresql://mtm:mtm@postgres:5432/commerce_ops?schema=public \
    CORE_API_URL=http://core-api:4000 \
    CORE_PUBLIC_URL=http://localhost:4000
COPY --from=deps /app ./
COPY . .
# Next copies `public` explicitly; keep the directory present for the ops image.
RUN mkdir -p apps/ops-admin/public
RUN bun run --cwd=apps/merchant-admin db:generate \
    && bun run --cwd=apps/ops-admin db:generate \
    && bun run --cwd=apps/core-api db:generate
# Build one app at a time: running both Next builds in parallel can exceed the
# memory available to constrained Docker daemons.
RUN bun run build -- --concurrency=1

# Merchant portal: Next standalone bundle traced from the monorepo root.
FROM node:22-slim AS merchant
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder /app/apps/merchant-admin/.next/standalone ./
COPY --from=builder /app/apps/merchant-admin/.next/static ./apps/merchant-admin/.next/static
COPY --from=builder /app/apps/merchant-admin/public ./apps/merchant-admin/public
EXPOSE 3000
CMD ["node", "apps/merchant-admin/server.js"]

# Ops portal.
FROM node:22-slim AS ops
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0
COPY --from=builder /app/apps/ops-admin/.next/standalone ./
COPY --from=builder /app/apps/ops-admin/.next/static ./apps/ops-admin/.next/static
COPY --from=builder /app/apps/ops-admin/public ./apps/ops-admin/public
EXPOSE 3001
CMD ["node", "apps/ops-admin/server.js"]

# core-api runs TypeScript directly on Bun. The generated Prisma client lives
# inside `apps/core-api/src/generated`, so copying the app tree is enough.
FROM oven/bun:1.4.4-slim AS core-api
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000 \
    HOSTNAME=0.0.0.0
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/core-api ./apps/core-api
COPY --from=builder /app/packages ./packages
EXPOSE 4000
CMD ["bun", "apps/core-api/src/index.ts"]

# One-shot migration/seed image. Compose overrides the default no-op command.
FROM builder AS migrate
WORKDIR /app
CMD ["sh", "-c", "true"]
