# syntax=docker/dockerfile:1

FROM oven/bun:1 AS deps
WORKDIR /app
# `prepare` runs `husky`, which has no `.git` in the build context.
ENV HUSKY=0
# sqlite3's install script fetches its N-API prebuild; use the same mirror as
# `.npmrc` so the image build does not depend on github.com release assets.
ENV npm_config_sqlite3_binary_host_mirror=https://registry.npmmirror.com/-/binary/sqlite3
COPY package.json bun.lock .npmrc ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_PATH=/data/mtm.sqlite
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs \
    && mkdir -p /data \
    && chown nextjs:nodejs /data
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# `sqlite3` is listed in next.config.ts `serverExternalPackages`, so standalone
# tracing omits it and its native binary. Copy it (and its runtime deps from
# `bindings`) explicitly.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sqlite3 ./node_modules/sqlite3
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/node-addon-api ./node_modules/node-addon-api
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.js"]
