# Phase 1: Monorepo & Data Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the single Next.js app into a Bun workspaces + Turborepo monorepo whose existing merchant pages run on PostgreSQL + Prisma, plus a Hono `core-api` skeleton with its own database.

**Architecture:** Move today's app unchanged into `apps/merchant-admin`, keep every existing route and test working while swapping Sequelize/SQLite for Prisma/PostgreSQL. Add `apps/core-api` with the `commerce_core` Prisma schema and a health endpoint. `packages/config` holds shared tool config; ops portal, auth/RBAC, and the four business modules arrive in later phase plans.

**Tech Stack:** Bun 1.4.4 workspaces, Turborepo, Next.js 15 (Node runtime), React 19, Prisma + PostgreSQL 17, Hono, Vitest, oxlint/oxfmt, TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-03-open-commerce-admin-design.md`

**Program roadmap (later plans, not tasks here):**

- Phase 2 — `apps/ops-admin` skeleton + Auth.js/RBAC for both portals + menus/permission codes.
- Phase 3 — `commerce_core` masters: merchants, shops, categories, brands, uploads; move merchant/category reads off the transitional tables.
- Phase 4 — products, versions, SKUs, audit state machine, product CRUD in both portals; delete the transitional product snapshot.
- Phase 5 — i18n, desensitization, README/LICENSE, Docker, CI, E2E, regression matrix.

## Global Constraints

- Package manager `bun@1.4.4`; workspaces `apps/*`, `packages/*`; lockfile `bun.lock`; orchestration with Turborepo.
- Next.js portals run on Node 22; `core-api` may run on Bun.
- One PostgreSQL instance, three logical databases: `commerce_core`, `commerce_ops`, `commerce_merchant`. Cross-database references are IDs only, never foreign keys.
- New domain tables (products, versions, SKUs, audits, media, ops tables) use `String @id @default(cuid())`. Migrated demo tables keep their existing identifiers as strings (no integer autoincrement, no data import from SQLite).
- Every merchant-scoped query takes `merchantId` from the session, never from a request parameter.
- Pages and feature components import UI only from `@/components/ui`; `antd` appears only inside `components/ui`, `app/layout.tsx`, `app/providers.tsx`.
- Lint `oxlint`, format `oxfmt`, types `tsc --noEmit`; unit/integration tests Vitest.
- Project name `mtm`; scoped packages `@mtm/*`; MIT license (copyright holder in `LICENSE`).
- No brand assets, internal domains, employee data, or private registries may enter new code.
- Node 22 for Next.js; keep `strict: false` and current TypeScript strictness during this phase.

## Scope Boundaries for Phase 1

- `apps/ops-admin` is **not** created in this phase. `apps/*` glob tolerates its later addition.
- Auth keeps today's captcha flow; RBAC, sub-accounts, and the two-portal JWT bridge are Phase 2.
- `Merchant`, `MerchantCategory`, and the selling `Product` payload stay in `commerce_merchant` as **transitional** tables with a `TRANSITIONAL` comment. Phase 3 moves merchant/category; Phase 4 replaces the product payload with the `core-api` projection.
- Docker deployment, CI, i18n, and brand cleanup are Phase 5. The root `Dockerfile` is left untouched and unused.
- `packages/contracts`, `packages/auth`, `packages/ui`, `packages/i18n` are not created; no empty shells.

## Review Focus

| #   | Input / condition                                                                           | Expected behavior                                                                                                         | Pinned by                                   |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | `bun run dev` on a machine without PostgreSQL running                                       | Bootstrap exits non-zero within 60 s with an actionable Chinese message; it does not hang or start apps against a dead DB | Task 7, stopped-container step              |
| 2   | A stale `data/*.sqlite` file or `DATABASE_PATH` env var in the working tree                 | Ignored by every app and test; no code path opens SQLite                                                                  | Task 7 grep + `bun run dev` without `data/` |
| 3   | 117 KB `merchant-options` JSON containing Chinese text and nested arrays                    | Round-trips through PostgreSQL JSON exactly (deep equality with the source mock)                                          | Task 4 seed test                            |
| 4   | Seed run twice, or two processes start together                                             | No duplicate rows, no unique-constraint crash; counts identical after the second run                                      | Task 4 idempotency test                     |
| 5   | An old JWT carrying numeric `accountId` / `merchantId` (2 hour sessions survive the deploy) | Session callbacks normalize ids to strings; `requireAccount()` keeps working                                              | Task 5 auth normalization test              |

---

### Task 1: Convert to Bun workspaces and move the app

**Files:**

- Create: `package.json` (root, replace), `turbo.json`
- Create: `apps/merchant-admin/package.json`
- Move with `git mv` into `apps/merchant-admin/`: `app/`, `components/`, `lib/`, `stores/`, `styles/`, `tests/`, `types/`, `public/`, `middleware.ts`, `next.config.ts`, `next-env.d.ts`, `tsconfig.json`, `vitest.config.ts`, `.browserslistrc`, `.oxlintrc.jsonc`, `.oxfmtrc.jsonc`
- Keep at root: `docs/`, `scripts/`, `CLAUDE.md`, `LICENSE`, `README.asciidoc`, `.github/`, `.husky/`, `.commitlintrc.json`, `.editorconfig`, `.npmrc`, `.bun-version`, `.gitignore`, `.gitattributes`, `Dockerfile`, `docker-compose.yml`, `.env.*`
- Test: whole existing suite via root scripts

**Interfaces:**

- Consumes: nothing.
- Produces: workspace package `@mtm/merchant-admin`; root scripts `dev`, `build`, `lint`, `fmt`, `fmt:check`, `typecheck`, `test`.

- [ ] **Step 1: Move the application files**

```bash
mkdir -p apps/merchant-admin packages
git mv app components lib stores styles tests types public \
  middleware.ts next.config.ts next-env.d.ts tsconfig.json vitest.config.ts \
  .browserslistrc .oxlintrc.jsonc .oxfmtrc.jsonc apps/merchant-admin/
```

- [ ] **Step 2: Write the root `package.json`**

Scripts: `dev` → `turbo run dev`, `build` → `turbo run build`, `lint` → `turbo run lint`, `fmt` → `turbo run format:fix`, `fmt:check` → `turbo run format`, `typecheck` → `turbo run typecheck`, `test` → `turbo run test`, `prepare` → `husky`. Set `"private": true`, `"packageManager": "bun@1.4.4"`, `"workspaces": ["apps/*", "packages/*"]`. Move `turbo`, `husky`, `lint-staged`, `@commitlint/*`, `oxlint`, `oxfmt` to root `devDependencies`; copy the `lint-staged` block from the old `package.json` unchanged. Do not put application dependencies at root.

- [ ] **Step 3: Write `apps/merchant-admin/package.json`**

Copy the old dependency and devDependency sets verbatim (Sequelize/SQLite still used until Task 5). Scripts: `dev` → `next dev -p 3000`, `build` → `next build`, `start` → `next start -p 3000`, `lint` → `oxlint`, `format` → `oxfmt --check`, `format:fix` → `oxfmt`, `typecheck` → `tsc --noEmit`, `test` → `vitest run`, `test:watch` → `vitest`, `smoke` → keep the existing command. Remove `prepare`.

- [ ] **Step 4: Write `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalEnv": ["NODE_ENV", "AUTH_SECRET", "MERCHANT_DATABASE_URL", "CORE_DATABASE_URL", "OPS_DATABASE_URL"],
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] },
    "lint": {},
    "format": {},
    "format:fix": { "cache": false },
    "typecheck": { "dependsOn": ["^typecheck"] },
    "test": {},
    "db:migrate": { "cache": false },
    "db:seed": { "cache": false },
    "db:reset": { "cache": false }
  }
}
```

- [ ] **Step 5: Install and verify from the repository root**

Run:

```bash
bun install
bun run lint
bun run typecheck
bun run test
bun run build
```

Expected: all commands exit 0; test summary still reports 22 passing tests; the Next build emits `apps/merchant-admin/.next/standalone/server.js`.

- [ ] **Step 6: Commit**

```bash
git add package.json turbo.json bun.lock apps/merchant-admin
git commit -m "refactor: move merchant app into bun workspace"
```

---

### Task 2: Extract shared tool config into `packages/config`

**Files:**

- Create: `packages/config/package.json`, `packages/config/tsconfig.base.json`, `packages/config/oxlint.jsonc`, `packages/config/oxfmt.jsonc`
- Delete: `apps/merchant-admin/.oxlintrc.jsonc`, `apps/merchant-admin/.oxfmtrc.jsonc`
- Modify: `apps/merchant-admin/tsconfig.json`, `apps/merchant-admin/package.json`, root `package.json` (lint-staged)
- Test: lint/typecheck/format from root

**Interfaces:**

- Consumes: workspace layout from Task 1.
- Produces: package `@mtm/config` exporting `./tsconfig`, `./oxlint`, `./oxfmt`; every app extends the tsconfig and passes the shared config paths to the CLIs.

- [ ] **Step 1: Create the shared TypeScript base**

Move the current `compilerOptions` (everything except `paths` and `plugins`) into `packages/config/tsconfig.base.json` with `"noEmit": true`. In `apps/merchant-admin/tsconfig.json`, keep `"extends": "../../packages/config/tsconfig.base.json"`, then keep only `paths` (`@/*` → `./*`), `plugins: [{ "name": "next" }]`, `include`, and `exclude`.

- [ ] **Step 2: Create shared oxlint/oxfmt configs**

`packages/config/package.json`:

```json
{
  "name": "@mtm/config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./tsconfig": "./tsconfig.base.json",
    "./oxlint": "./oxlint.jsonc",
    "./oxfmt": "./oxfmt.jsonc"
  }
}
```

Move the current lint rules into `packages/config/oxlint.jsonc`, changing `ignorePatterns` to `["**/.next", "**/dist", "**/generated"]`, and move the existing antd `no-restricted-imports` override into it with these app-relative patterns: `files: ["app/**", "components/**", "lib/**", "scripts/**", "tests/**"]`, `excludeFiles: ["components/ui/**", "app/layout.tsx", "app/providers.tsx"]`. Move the formatter settings into `packages/config/oxfmt.jsonc` unchanged except the ignore list (`**/bun.lock`, `**/.next`, `**/dist`, `**/generated`).

Delete both app-level config files. App scripts point at the shared files explicitly (oxlint `-c` and oxfmt `--config` are stable CLI flags, unlike config `extends`):

```json
{
  "lint": "oxlint -c ../../packages/config/oxlint.jsonc",
  "format": "oxfmt --check --config ../../packages/config/oxfmt.jsonc",
  "format:fix": "oxfmt --config ../../packages/config/oxfmt.jsonc"
}
```

Update the root `lint-staged` block the same way: `oxlint --fix -c packages/config/oxlint.jsonc` and `oxfmt --write --config packages/config/oxfmt.jsonc`.

Fallback (only if the installed CLI rejects these flags): keep a minimal app-level config that contains `"extends": ["../../packages/config/oxlint.jsonc"]` for oxlint and a verbatim copy of the formatter settings in the app. Record the fallback in the commit message; do not leave both paths half-wired.

- [ ] **Step 3: Verify config resolution**

```bash
bun install
bun run lint
bun run fmt:check
bun run typecheck
```

Expected: exit 0, and deliberately adding `import { Button } from 'antd'` to `app/(admin)/page.tsx` makes `bun run lint` fail with the Chinese restriction message; remove the import afterwards.

- [ ] **Step 4: Commit**

```bash
git add packages/config apps/merchant-admin/.oxlintrc.jsonc apps/merchant-admin/.oxfmtrc.jsonc apps/merchant-admin/tsconfig.json package.json bun.lock
git commit -m "chore: share tool config across workspaces"
```

---

### Task 3: Add PostgreSQL and the `commerce_merchant` Prisma schema

**Files:**

- Create: `docker-compose.yml` (replace), `.env.example` (replace), `apps/merchant-admin/prisma/schema.prisma`, `apps/merchant-admin/tests/global-setup.ts`
- Modify: `apps/merchant-admin/package.json`, `apps/merchant-admin/vitest.config.ts`, `apps/merchant-admin/tests/setup.ts`, `.gitignore`
- Test: `apps/merchant-admin/tests/db/prisma-schema.test.ts` (new)

**Interfaces:**

- Consumes: workspace + config from Tasks 1–2.
- Produces: `apps/merchant-admin/lib/db/client.ts` → `export const prisma: PrismaClient`; generated client at `@/lib/generated/prisma`; env vars `MERCHANT_DATABASE_URL`, `MERCHANT_TEST_DATABASE_URL`; migration `prisma/migrations/*_init`.

**Schema decisions (locked):**

| Sequelize model                                   | Prisma model       | Primary key                                                |
| ------------------------------------------------- | ------------------ | ---------------------------------------------------------- |
| `Account`                                         | `MerchantAccount`  | `String @id` (seed `"1"`, runtime `@default(cuid())`)      |
| `Merchant` (transitional)                         | `Merchant`         | `String @id`, seed `"1"`                                   |
| `MerchantCategory` (transitional)                 | `MerchantCategory` | `String @id` = `String(old numeric id)`; `parentId String` |
| `MerchantLicense`                                 | `MerchantLicense`  | `String @id` = old id as string                            |
| `MerchantEntry`                                   | `MerchantEntry`    | `merchantId String @id`                                    |
| `EntryTask`                                       | `EntryTask`        | `String @id` = old id as string                            |
| `EntryType`                                       | `EntryType`        | `code String @id`                                          |
| `MenuItem` / `MenuBadge`                          | same               | existing string key                                        |
| `MenuPreference` / `MenuFavorite`                 | same               | `@@id([accountId, menuId])`                                |
| `Coupon` / `Campaign` / `Message` / `Violation`   | same               | existing string / composite keys                           |
| `GoldPeriod`                                      | `GoldPeriod`       | `String @id` seed `"1"`                                    |
| `GoldStandard`                                    | `GoldStandard`     | `key String @id`                                           |
| `MerchantTask`                                    | `MerchantTask`     | `String @id` seed `"1"`                                    |
| `Registration` / `Invitation`                     | same               | `String @id @default(cuid())`                              |
| `ReferenceData` / `AnalysisSnapshot` / `SeedMeta` | same               | existing string keys                                       |
| `Product` (transitional payload)                  | `Product`          | `String @id @default(cuid())`                              |

Rules:

- Keep every existing field; `DataTypes.JSON` → `Json?`; `TEXT` → `String? @db.Text`; `FLOAT` → `Float?` (legacy tables only; new money uses `Decimal` from Phase 4); `DATE` → `DateTime?`.
- `MerchantAccount` adds `username String @unique`, `passwordHash String?`, `name String`, `phone String?`, `interCode String @default("86")`, `isOwner Boolean @default(false)`, `status AccountStatus @default(ACTIVE)`, `lastLoginAt DateTime?`, `createdAt DateTime @default(now())`. Map old `login` → `username`, `mobile` → `phone` in code, not columns.
- Add Phase 2 authorization tables now so the schema migrates once: `MerchantRole`, `MerchantPermission`, `MerchantAccountRole`, `MerchantRolePermission`, `MerchantLoginLog`, `MerchantOperationLog`, enums `AccountStatus`, `PermissionType`. No seed data or behavior yet.
- Add `permissionCode String?` to `MenuItem` now; Phase 2 populates it.
- Mark transitional models with `// TRANSITIONAL:` comments naming the phase that removes them.

- [ ] **Step 1: Write `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:17-alpine
    ports: ['127.0.0.1:5432:5432']
    environment:
      POSTGRES_USER: mtm
      POSTGRES_PASSWORD: mtm
      POSTGRES_DB: postgres
    volumes:
      - mtm-postgres:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U mtm -d postgres']
      interval: 2s
      timeout: 3s
      retries: 30
    restart: unless-stopped

volumes:
  mtm-postgres:
```

- [ ] **Step 2: Write `.env.example`**

```dotenv
# PostgreSQL (docker compose)
MERCHANT_DATABASE_URL=postgresql://mtm:mtm@localhost:5432/commerce_merchant?schema=public
CORE_DATABASE_URL=postgresql://mtm:mtm@localhost:5432/commerce_core?schema=public
OPS_DATABASE_URL=postgresql://mtm:mtm@localhost:5432/commerce_ops?schema=public
# Test databases (never point these at development data)
MERCHANT_TEST_DATABASE_URL=postgresql://mtm:mtm@localhost:5432/commerce_merchant_test?schema=public
CORE_TEST_DATABASE_URL=postgresql://mtm:mtm@localhost:5432/commerce_core_test?schema=public
# Auth
AUTH_SECRET=change-me
```

Add `.env`, `apps/*/lib/generated/`, `apps/*/src/generated/`, `*.sqlite*` to `.gitignore`; delete `data/*.sqlite*` from the ignore list.

- [ ] **Step 3: Write `prisma/schema.prisma`**

Use `provider = "postgresql"`, `url = env("MERCHANT_DATABASE_URL")`, and:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../lib/generated/prisma"
}
```

Then define every model from the locked table above. Run `bunx prisma validate --schema prisma/schema.prisma` until it passes.

- [ ] **Step 4: Add scripts and the Prisma client singleton**

In `apps/merchant-admin/package.json` add these scripts. The `--env-file=../../.env` prefix is required because Bun and Prisma resolve `.env` from the package directory, while Phase 1 keeps one `.env` at the repository root:

```json
{
  "db:generate": "prisma generate",
  "db:migrate": "bun --env-file=../../.env x prisma migrate deploy",
  "db:migrate:dev": "bun --env-file=../../.env x prisma migrate dev",
  "db:seed": "bun --env-file=../../.env prisma/seed.ts",
  "db:reset": "bun --env-file=../../.env x prisma migrate reset --force --skip-seed && bun --env-file=../../.env prisma/seed.ts",
  "postinstall": "prisma generate"
}
```

Create `apps/merchant-admin/lib/db/client.ts`:

```ts
import { PrismaClient } from '@/lib/generated/prisma';

const globalForPrisma = globalThis as typeof globalThis & { __mtmPrisma?: PrismaClient };

export const prisma = globalForPrisma.__mtmPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__mtmPrisma = prisma;
}
```

Add `apps/merchant-admin/prisma/seed.ts` as a stub that only writes `SeedMeta({ version: 'bootstrap' })`; Task 4 fills it. Wrap in `try/finally { await prisma.$disconnect() }`.

- [ ] **Step 5: Create the initial migration**

```bash
docker compose up -d postgres
cp .env.example .env
for db in commerce_merchant commerce_merchant_test commerce_core commerce_core_test commerce_ops; do
  docker compose exec -T postgres psql -U mtm -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db'" | grep -q 1 \
    || docker compose exec -T postgres createdb -U mtm "$db"
done
bun --cwd apps/merchant-admin run db:generate
bun --cwd apps/merchant-admin run db:migrate:dev -- --name init
```

Expected: `prisma/migrations/<timestamp>_init/migration.sql` exists; `psql` shows all tables.

- [ ] **Step 6: Wire the test database**

`tests/setup.ts` must set `process.env.MERCHANT_DATABASE_URL ||= process.env.MERCHANT_TEST_DATABASE_URL ?? 'postgresql://mtm:mtm@localhost:5432/commerce_merchant_test?schema=public'` before any database import.

`tests/global-setup.ts` runs `bunx prisma migrate reset --force --skip-seed --skip-generate` with the test URL and `stdio: 'inherit'`.

`vitest.config.ts` adds `globalSetup: ['./tests/global-setup.ts']`, `fileParallelism: false`, and `testTimeout: 30_000`.

- [ ] **Step 7: Write the schema smoke test**

`tests/db/prisma-schema.test.ts` imports `prisma` from `@/lib/db/client` and asserts: `await prisma.$queryRaw\`SELECT 1\``resolves, and`await prisma.seedMeta.count()`resolves to a number (the table exists; no row is expected until Task 4). Disconnect with`prisma.$disconnect()`in`afterAll`. Task 4 extends the seed coverage in its own test file.

- [ ] **Step 8: Verify**

```bash
bun --cwd apps/merchant-admin run test -- tests/db/prisma-schema.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add docker-compose.yml .env.example .gitignore apps/merchant-admin/prisma apps/merchant-admin/tests apps/merchant-admin/vitest.config.ts apps/merchant-admin/package.json bun.lock
git commit -m "feat(db): add postgres and commerce_merchant prisma schema"
```

---

### Task 4: Port seed data to Prisma

**Files:**

- Modify: `apps/merchant-admin/lib/db/seed/ids.ts` (new), `lib/db/seed/types.ts` (new), `lib/db/seed/transformers.ts`, `lib/db/seed/core.ts`, `lib/db/seed/marketing.ts`, `lib/db/seed/index.ts`, `lib/db/index.ts`, `prisma/seed.ts`
- Test: `apps/merchant-admin/tests/lib/db/prisma-seed.test.ts` (new)

**Interfaces:**

- Consumes: `prisma` from Task 3; existing mock JSON under `lib/db/seed/data/**`.
- Produces: `SEED_ACCOUNT_ID = '1'`, `SEED_MERCHANT_ID = '1'`, `SEED_GOLD_PERIOD_ID = '1'`, `SEED_PRODUCT_ID = 'seed-product-1'`, `SEED_MERCHANT_TASK_ID = '1'`, `SEED_VIOLATION_ID = '1'`; `seedDatabase(): Promise<void>` idempotent; `initDatabase(): Promise<void>` initializes once per process.

- [ ] **Step 1: Write the idempotency and round-trip test first**

`tests/lib/db/prisma-seed.test.ts`:

```ts
import { afterAll, expect, test } from 'vitest';

const { prisma, initDatabase } = await import('@/lib/db');
const { seedDatabase } = await import('@/lib/db/seed');
const { dataOf } = await import('@/lib/db/seed/transformers');
import merchantOptionsGet from '@/lib/db/seed/data/main/merchant/options/get.json';

afterAll(() => prisma.$disconnect());

test('seeds the same counts twice', async () => {
  await initDatabase();
  const before = {
    menu: await prisma.menuItem.count(),
    categories: await prisma.merchantCategory.count(),
    favorites: await prisma.menuFavorite.count(),
  };
  await seedDatabase();
  expect(await prisma.menuItem.count()).toBe(before.menu);
  expect(await prisma.merchantCategory.count()).toBe(before.categories);
  expect(await prisma.menuFavorite.count()).toBe(before.favorites);
  expect(before).toEqual({ menu: 54, categories: 173, favorites: 10 });
});

test('round-trips the 117KB merchant options JSON', async () => {
  await initDatabase();
  const row = await prisma.referenceData.findUniqueOrThrow({ where: { key: 'merchant-options' } });
  expect(row.payload).toEqual(dataOf(merchantOptionsGet));
});
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
bun --cwd apps/merchant-admin run test -- tests/lib/db/prisma-seed.test.ts
```

Expected: FAIL — `initDatabase` / `seedDatabase` still write through Sequelize, so Prisma counts are 0.

- [ ] **Step 3: Add seed id constants and row types**

`lib/db/seed/ids.ts` exports the constants listed in Interfaces. `lib/db/seed/types.ts` defines plain row interfaces (`MenuRow`, `CategoryRow`, `AccountRow`, …) that mirror the Prisma create shapes. Transformers import these types instead of Sequelize `*CreationAttributes`.

- [ ] **Step 4: Update transformers**

- `transformCategories`: `id: String(row.id)`, `parentId: String(row.parentId)`.
- `transformMerchantDetail`: `id: SEED_MERCHANT_ID`; `transformMerchantList`: `id: String(row.id)`.
- `transformAccount`: `id: SEED_ACCOUNT_ID`, `merchantId: SEED_MERCHANT_ID`; add `username` (= old `login`), `phone` (= mobile), `name: '演示商家管理员'`, `isOwner: true`.
- `transformLicenses`: `id: String(row.id)`, `merchantId: SEED_MERCHANT_ID`.
- `transformEntry`: `merchantId: SEED_MERCHANT_ID`; `transformEntryTask`: `id: String(...)`, `merchantId: SEED_MERCHANT_ID`.
- `transformProductSelling`: `id: SEED_PRODUCT_ID`.
- `transformGold`: period `id: SEED_GOLD_PERIOD_ID`; every standard `periodId: SEED_GOLD_PERIOD_ID`.
- `transformMerchantTasks`: `id: SEED_MERCHANT_TASK_ID`; `transformViolationOverview`: `id: SEED_VIOLATION_ID`.

- [ ] **Step 5: Rewrite `seedCore` and `seedMarketing` with Prisma**

Use `createMany({ data, skipDuplicates: true })` per table inside `prisma.$transaction([...])`; use `upsert` for `SeedMeta` version rows. Keep the same `CORE_SEED_VERSION` and `MARKETING_SEED_VERSION` strings. Never read the old SQLite database.

`lib/db/index.ts`:

```ts
import { prisma } from './client';
import { seedDatabase } from './seed';

let initPromise: Promise<void> | null = null;

export async function initDatabase(): Promise<void> {
  initPromise ??= (async () => {
    await prisma.$queryRaw`SELECT 1`;
    await seedDatabase();
  })().catch(error => {
    initPromise = null;
    throw error;
  });

  return initPromise;
}

export { prisma };
```

`prisma/seed.ts` calls `seedDatabase()` and exits. `lib/db/seed/index.ts` keeps the two version checks, now using `prisma.seedMeta.findUnique`.

- [ ] **Step 6: Run the new test, then the legacy suite**

```bash
bun --cwd apps/merchant-admin run test -- tests/lib/db/prisma-seed.test.ts
bun run test
```

Expected: the new test passes; legacy SQLite tests still pass until Task 5 removes them.

- [ ] **Step 7: Commit**

```bash
git add apps/merchant-admin/lib/db apps/merchant-admin/prisma/seed.ts apps/merchant-admin/tests/lib/db/prisma-seed.test.ts
git commit -m "feat(db): seed commerce_merchant through prisma"
```

---

### Task 5: Switch services, auth, and tests to Prisma; delete Sequelize

**Files:**

- Delete: `apps/merchant-admin/lib/db/connection.ts`, `lib/db/config.ts`, `lib/db/models/**`
- Modify: `lib/db/index.ts`, `lib/services/{account,menu,merchant,entry,reference-data,registration,venus,coupon,campaign,message,violation,product,gold,merchant-task,analysis}.ts`, `lib/auth.ts`, `lib/auth.config.ts`, `lib/auth-guard.ts`, `types/next-auth.d.ts`, `next.config.ts`, `package.json`, `app/api/health/route.ts`, and any route/page that `tsc` reports after the string-ID change (the session `accountId`/`merchantId` and service arguments become strings)
- Modify: `tests/lib/db/init.test.ts`, `tests/lib/db/core-seed.test.ts`, `tests/lib/db/marketing-seed.test.ts`, `tests/lib/services/core.test.ts`, `tests/lib/services/marketing.test.ts`, `tests/lib/services/coupon-handler.test.ts`, `tests/lib/services/analysis.test.ts`, `tests/lib/menu/favorites.test.ts`, `tests/lib/auth-config.test.ts`
- Test: full Vitest suite

**Interfaces:**

- Consumes: `prisma`, seeds, and ids from Task 4.
- Produces: all service exports keep their names and DTO shapes except numeric IDs become strings. `AuthContext = { accountId: string; merchantId: string }`; `Session.user.accountId/merchantId: string`.

- [ ] **Step 1: Write the ID-normalization test first**

Add to `tests/lib/auth-config.test.ts`:

```ts
test('normalizes legacy numeric session ids to strings', async () => {
  const { authConfig } = await import('@/lib/auth.config');
  const session = authConfig.callbacks.session!({
    session: { user: {} },
    token: { sub: '1', accountId: 1, merchantId: 1, mobile: '13412345678', interCode: '86', login: 'demo' },
  } as never);
  expect(session.user?.accountId).toBe('1');
  expect(session.user?.merchantId).toBe('1');
});
```

Also change existing calls to `getMenu(1)` → `getMenu(SEED_ACCOUNT_ID)`, `getEntry(1)` → `getEntry(SEED_MERCHANT_ID)`, `listLicenses(1)` → `listLicenses(SEED_MERCHANT_ID)`, `getMerchant(1)` → `getMerchant(SEED_MERCHANT_ID)` where the argument is an internal ID. Keep the assertion `merchant.id === 123456` (the DTO projects `payload.id`); change `entry.merchantId` to `SEED_MERCHANT_ID` and `entry.entryTaskId` to the string `'82025'`.

- [ ] **Step 2: Run the suite and confirm the expected failures**

```bash
bun --cwd apps/merchant-admin run test
```

Expected: failures in the tests that still import Sequelize models and in the new normalization test.

- [ ] **Step 3: Port the core services**

Replace Sequelize calls with Prisma equivalents, keeping exported signatures:

- `account.ts`: `prisma.merchantAccount.findUnique`, `findFirst({ where: { interCode, phone } })`, `create({ data: { username: phone, phone, interCode, merchantId: SEED_MERCHANT_ID, name: phone, isOwner: false } })`. `AccountDTO` ids are `string`.
- `menu.ts`: `prisma.menuItem.findMany`, `menuFavorite.findMany`, `menuBadge.findMany`, `menuFavorite.deleteMany` + `createMany` inside `prisma.$transaction` for updates.
- `merchant.ts`: `prisma.merchant.findUnique` / `findMany`, `merchantCategory.findMany`, `merchantLicense.findMany`, `merchant.update({ data: { payload } })`. Return `String` IDs in DTOs; keep `toMerchantDTO` projecting `payload.id`.
- `entry.ts`, `reference-data.ts`, `registration.ts`, `venus.ts`: direct Prisma reads/writes; keep DTO field names.

- [ ] **Step 4: Port the marketing and analytics services**

`coupon.ts` (including the `status = 6` soft delete), `campaign.ts`, `message.ts`, `violation.ts`, `product.ts`, `gold.ts`, `merchant-task.ts`, `analysis.ts` follow the same pattern: `findMany`, `count`, `findUnique`, `create`, `update`; `orderBy: { id: 'asc' }` where `findAll` previously ordered by id. Wrap multi-row writes in `prisma.$transaction`.

- [ ] **Step 5: Port auth and the session types**

- `lib/auth.ts`: `upsertAccount` returns string ids; `accountId: account.id` stays a string.
- `lib/auth.config.ts`: `jwt` uses `String(user.accountId)` / `String(user.merchantId)`; `session` uses `String(token.accountId)` / `String(token.merchantId)` with undefined guards.
- `types/next-auth.d.ts`: `accountId: string`, `merchantId: string` in `User`, `Session`, and `JWT`.
- `lib/auth-guard.ts`: `AuthContext` fields are `string`.

- [ ] **Step 6: Remove Sequelize and the old SQLite path**

```bash
grep -rn "sequelize\|findByPk\|findAndCountAll\|bulkCreate\|DATABASE_PATH" apps/merchant-admin --include='*.ts' --include='*.tsx'
```

Every remaining hit must be deleted. Remove `lib/db/models`, `lib/db/connection.ts`, `lib/db/config.ts`, and the `sequelize`/`sqlite3` dependencies and `trustedDependencies` entry. In `next.config.ts` delete `serverExternalPackages` (verify the build still traces the Prisma engine; add `serverExternalPackages: ['@prisma/client']` only if the standalone build fails at runtime).

- [ ] **Step 7: Rewrite the old database tests**

- `init.test.ts`: call `initDatabase()` twice, assert one `seedMeta` row, run `prisma.$queryRaw\`SELECT 1\``, disconnect.
- `core-seed.test.ts`: assert `menuItem.count() === 54`, `menuFavorite.count() === 10`, `merchantCategory.count() === 173`; find the account by `phone: '13412345678'`, assert `interCode === '86'`.
- `marketing-seed.test.ts`, `core.test.ts`, `marketing.test.ts`, `coupon-handler.test.ts`, `analysis.test.ts`, `favorites.test.ts`: replace model imports with `prisma` / services; ports and assertions stay the same, IDs become the seed strings.

- [ ] **Step 8: Run the whole suite and static checks**

```bash
bun run test
bun run lint
bun run typecheck
bun run build
```

Expected: all 22 existing tests pass (plus the new normalization test); no Sequelize/SQLite references; build succeeds.

- [ ] **Step 9: Commit**

```bash
git add apps/merchant-admin
git commit -m "refactor(db): run merchant services on prisma"
```

---

### Task 6: Add `apps/core-api` with the `commerce_core` schema

**Files:**

- Create: `apps/core-api/package.json`, `apps/core-api/tsconfig.json`, `apps/core-api/prisma/schema.prisma`, `apps/core-api/prisma/seed.ts`, `apps/core-api/src/index.ts`, `apps/core-api/src/app.ts`, `apps/core-api/src/db.ts`, `apps/core-api/tests/health.test.ts`, `apps/core-api/tests/global-setup.ts`, `apps/core-api/vitest.config.ts`
- Test: `apps/core-api/tests/health.test.ts`

**Interfaces:**

- Consumes: `CORE_DATABASE_URL`, `CORE_TEST_DATABASE_URL`, workspace conventions from Tasks 1–3.
- Produces: `GET /health` → `200 { "status": "ok", "db": true }`; `createApp(): Hono` for tests; Prisma client for `commerce_core`.

- [ ] **Step 1: Scaffold the package**

`package.json`: name `@mtm/core-api`, `"dev": "bun --watch src/index.ts"`, `"build": "tsc --noEmit"`, `"start": "bun src/index.ts"`, `"lint": "oxlint -c ../../packages/config/oxlint.jsonc"`, `"format": "oxfmt --check --config ../../packages/config/oxfmt.jsonc"`, `"format:fix": "oxfmt --config ../../packages/config/oxfmt.jsonc"`, `"typecheck": "tsc --noEmit"`, `"test": "vitest run"`, `"db:generate": "prisma generate"`, `"db:migrate": "bun --env-file=../../.env x prisma migrate deploy"`, `"db:migrate:dev": "bun --env-file=../../.env x prisma migrate dev"`, `"db:seed": "bun --env-file=../../.env prisma/seed.ts"`, `"db:reset": "bun --env-file=../../.env x prisma migrate reset --force --skip-seed && bun --env-file=../../.env prisma/seed.ts"`, `"postinstall": "prisma generate"`. Dependencies: `hono`, `@hono/node-server`, `@hono/zod-openapi`, `@prisma/client`, `zod`; dev: `prisma`, `typescript`, `vitest`, `@types/node`.

`tsconfig.json` extends `../../packages/config/tsconfig.base.json` with `"types": ["node"]` and `"paths": { "@/*": ["./*"] }`. `vitest.config.ts` mirrors that alias with `resolve.alias['@']`.

`prisma/seed.ts` only upserts `SeedMeta({ version: 'bootstrap' })` in this phase; domain seeds arrive with Phase 3.

- [ ] **Step 2: Write the `commerce_core` schema**

Copy spec section 6.1 verbatim and add the back-relations Prisma requires (`ProductVersion.product`, `Product.versions`, `ProductVersion.audits/skus`, `Category.children/parent`, `Merchant.shops`, `Shop.merchant`). Add `SeedMeta` (`version String @id`, `appliedAt DateTime @default(now())`) and these enums: `MerchantStatus`, `ShopStatus`, `CategoryStatus`, `AttributeType`, `BrandStatus`, `ProductVersionStatus`.

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("CORE_DATABASE_URL")
}
```

Run `bunx prisma validate --schema prisma/schema.prisma` until it passes.

- [ ] **Step 3: Write the failing health test**

`tests/health.test.ts`:

```ts
import { expect, test } from 'vitest';

import { createApp } from '@/src/app';

test('GET /health reports database readiness', async () => {
  const response = await createApp().request('/health');
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok', db: true });
});
```

Run `bun --cwd apps/core-api run test`; expected FAIL because `createApp` does not exist.

- [ ] **Step 4: Implement the app**

`src/db.ts` exports the singleton `prisma` (same global pattern as Task 3). `src/app.ts` exports `createApp()` returning a Hono app with `app.get('/health', ...)` that runs `prisma.$queryRaw\`SELECT 1\``and returns`{ status: 'ok', db: true }`; on failure return `503 { status: 'error', db: false }`. `src/index.ts`runs`createApp()`on port`4000`with`@hono/node-server`.

- [ ] **Step 5: Add test database setup and run the test**

`vitest.config.ts` points `globalSetup` at `tests/global-setup.ts`, which runs `prisma migrate reset --force --skip-seed` with `CORE_TEST_DATABASE_URL`; the test sets `CORE_DATABASE_URL ||= CORE_TEST_DATABASE_URL`. Run `bun --cwd apps/core-api run test`; expected PASS after migrations exist. Create the migration with:

```bash
bun --cwd apps/core-api run db:migrate:dev -- --name init
```

- [ ] **Step 6: Verify static checks**

```bash
bun --cwd apps/core-api run typecheck
bun --cwd apps/core-api run lint
```

Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add apps/core-api bun.lock
git commit -m "feat(core-api): add hono service and commerce_core schema"
```

---

### Task 7: One-command bootstrap, cleanup, and handoff docs

**Files:**

- Create: `scripts/dev-bootstrap.mjs`
- Modify: `package.json`, `turbo.json`, `.env.example`, `.gitignore`, `README.asciidoc`, `CLAUDE.md`, move `apps/merchant-admin/scripts/{smoke.ts,session-cookie.ts}` if still at root
- Delete: `data/` contents, root SQLite leftovers

**Interfaces:**

- Consumes: all prior tasks.
- Produces: `bun run dev` starts PostgreSQL, creates databases, migrates, seeds, then runs `merchant-admin` (:3000) and `core-api` (:4000); `bun run db:reset` rebuilds both databases.

- [ ] **Step 1: Write `scripts/dev-bootstrap.mjs`**

Behavior, in order:

1. Run `docker compose up -d postgres`; if the command fails, print `PostgreSQL 未启动：请先安装并启动 Docker，然后重新执行 bun run dev。` and `process.exit(1)`.
2. Poll `docker compose exec -T postgres pg_isready -U mtm -d postgres` every 1 s for at most 60 s; on timeout print the same actionable message and exit 1.
3. For each of `commerce_merchant`, `commerce_ops`, `commerce_core`, `commerce_merchant_test`, `commerce_core_test`: `psql -tAc "SELECT 1 FROM pg_database WHERE datname='<name>'"`; create with `CREATE DATABASE "<name>"` when missing.
4. Run `bun --cwd apps/merchant-admin run db:generate && bun --cwd apps/merchant-admin run db:migrate && bun --cwd apps/merchant-admin run db:seed`.
5. Run the same three commands for `apps/core-api`.
6. Exit 0; do not start the apps.

- [ ] **Step 2: Wire root scripts and env**

Root `package.json`:

```json
{
  "dev": "bun scripts/dev-bootstrap.mjs && turbo run dev",
  "db:migrate": "bun scripts/dev-bootstrap.mjs && turbo run db:migrate",
  "db:seed": "turbo run db:seed",
  "db:reset": "bun scripts/dev-bootstrap.mjs && turbo run db:reset"
}
```

The bootstrap never starts applications, so it is safe before every database command. Every step is idempotent.

- [ ] **Step 3: Update docs**

- `README.asciidoc`: replace the SQLite/Docker-app instructions with prerequisites (Bun 1.4.4, Docker, Node 22), `cp .env.example .env`, `bun install`, `bun run dev`, ports 3000/4000, demo login `13412345678` + on-screen captcha, and `bun run db:reset`.
- `CLAUDE.md`: update "当前状态" to "阶段 1 已完成（monorepo + PostgreSQL/Prisma 数据层）"; update commands for workspaces; point to this plan.
- Leave the root `Dockerfile` and `.github/` untouched with a one-line README note that deployment is Phase 5.

- [ ] **Step 4: Remove SQLite leftovers**

```bash
grep -rn "DATABASE_PATH\|sqlite" apps scripts package.json README.asciidoc --include='*.ts' --include='*.tsx' --include='*.mjs' --include='*.json' --include='*.asciidoc'
rm -rf data
rm -f .env.development .env.production
```

Expected: no hits. Update `apps/merchant-admin/scripts/smoke.ts` to drop `DATABASE_PATH`/`SMOKE_DATABASE_PATH` and rely on `MERCHANT_DATABASE_URL`. The root `Dockerfile` still mentions SQLite and `.env.production`; it is intentionally untouched until Phase 5, and `README.asciidoc` states deployment support is pending.

- [ ] **Step 5: Verify the happy path from a clean database**

```bash
docker compose down -v
bun run db:reset
bun run dev
```

Expected: both databases migrate and seed; `:3000` serves `/login`; `:4000/health` returns `{ "status": "ok", "db": true }`; the merchant dashboard loads seeded data. Stop the dev process afterwards.

- [ ] **Step 6: Verify the failure path**

```bash
docker compose stop postgres
bun run dev
echo "exit=$?"
```

Expected: exit code 1 within 60 s and the message `PostgreSQL 未启动：…` (Review Focus #1). Restart PostgreSQL afterwards.

- [ ] **Step 7: Final full verification**

```bash
bun run lint
bun run fmt:check
bun run typecheck
bun run test
bun run build
```

Expected: all exit 0; tests cover the merchant app and `core-api`; no Sequelize/SQLite/`DATABASE_PATH` references remain.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(dev): bootstrap postgres and run workspaces with one command"
```
