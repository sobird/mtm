# Next.js 全量迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把主应用与 `packages/mtm_market` 合并为一个 Next.js App Router 应用，移除 qiankun/Module Federation，彻底删除 Antd，改用 headless UI + CSS Modules，并用 Next Route Handlers + Sequelize + SQLite 重建接口层。

**Architecture:** 单仓库单应用。页面优先用 Server Components 直连 `lib/services`；客户端交互走 `app/api/**` Route Handlers。数据来自现有 mock JSON 的幂等种子（SQLite）。认证用 NextAuth Credentials + JWT。部署为 Docker standalone + SQLite volume。

**Tech Stack:** Next.js (App Router, Node runtime), React, TypeScript, bun, Sequelize v6 + sqlite3, NextAuth (Auth.js), TanStack Query/Table, Zustand, React Hook Form + Zod, Base UI + CSS Modules, Recharts, Vitest + Testing Library, Docker.

**Spec:** `docs/superpowers/specs/2026-11-03-nextjs-migration-design.md`

## Global Constraints

- Next.js App Router，Node.js 运行时，`output: 'standalone'`；生产容器 Node 22 LTS。
- 包管理器保持 bun（`bun@1.4.4`），提交 `bun.lock`。
- 最终依赖树不得包含：`antd`、`@ant-design/*`、`qiankun`、`react-router-dom`、`@reduxjs/toolkit`、`react-redux`、`redux`、`redux-thunk`、`axios`、`history`。
- UI 只用 Base UI primitives + CSS Modules + `styles/tokens.css` 变量；不引入 Tailwind/CSS-in-JS。
- 只做亮色主题。
- 所有页面使用真实路径（`/login`、`/market/...`），不做 hash 兼容。
- 登录保留 `interCode`（86/65/852/853），验证码在 UI 中直接展示（演示行为）。
- 优惠券“删除”= 软删除（`status = 6`）；列表与详情共用超集表、两套 DTO。
- 菜单收藏上限 10；未迁移的菜单链接保留展示，点击落到全局 `not-found`。
- 认证：NextAuth Credentials + JWT，会话 2 小时；不使用数据库 adapter。
- 数据层：SQLite 单实例；`DATABASE_PATH` 默认 `./data/mtm.sqlite`；生产 `/data/mtm.sqlite`（volume）；`sequelize.sync()` + 幂等种子，不写迁移。
- 接口响应统一 `{ code, message, data }`；成功 `code = 0`。
- Server Components 直接调用 `lib/services`；Route Handlers 只做鉴权 + 校验 + 调 service。
- `/mdx`、`/component` 删除；`/api/api/thh/task/gold/merchant` 并入 `/api/merchant/gold`。
- TypeScript 保持 `strict: false`；不借迁移扩大类型改造范围。
- 测试策略：数据层、DTO、校验、状态逻辑用 Vitest；UI 以 `typecheck` + `build` + 路由 smoke 验证。
- 每个任务一个提交；提交信息遵循 Conventional Commits；不跳过 hook。

## Review Focus

- 非中国大陆区号登录/注册（65/852/853）应按各自正则通过，非法号码应被拒绝，并且区号进入会话。由 Task 14 的测试覆盖。
- 优惠券详情 id `1070734573` 不在列表数据中，深链 `/market/coupon/1070734573` 仍须返回完整详情。由 Task 7 覆盖。
- 优惠券下线后列表状态过滤、`total` 与分页必须来自数据库而不是 mock 的 146。由 Task 7 覆盖。
- 菜单收藏重复添加、已收藏项再次提交、第 11 项都应被正确处理。由 Task 5 覆盖。
- 容器重启后种子必须幂等，已有数据不能重复插入，volume 中 SQLite 文件必须可写。由 Task 4 与 Task 24 覆盖。

---

## Conventions

- 从 `master` 新建分支：`git switch -c feat/nextjs-migration`。
- **组件命名：** React 组件名与文件名使用 PascalCase，并保持一致。
- **组件目录：** 单文件组件放在以组件名命名的目录中，入口用 `index.tsx`，例如 `components/ui/Button/index.tsx`。
- **组件样式：** CSS Module 与组件同名，放在同一目录，例如 `components/ui/Button/Button.module.css`。
- **非组件模块：** 沿用现有风格（service/hook/util 使用 camelCase 文件名，目录小写）。
- **组件测试：** 测试文件与组件同名，例如 `tests/components/Button.test.tsx`。
- 测试命令：`bun run test`；类型：`bun run typecheck`；构建：`bun run build`。
- 每个任务完成后提交，示例：`feat(db): 初始化 Sequelize 与幂等种子`。
- 迁移期间旧 `src/`、`packages/` 保留在原位但被 `tsconfig`/oxlint 排除；Task 23 统一删除。

---

### Task 1: Next.js 脚手架与测试基线

**Files:**

- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `.gitignore`
- Modify: `.oxlintrc.jsonc`
- Modify: `.oxfmtrc.jsonc`
- Create: `next.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/lib/pagination.test.ts`
- Create: `lib/pagination.ts`
- Create: `.env.example`

**Interfaces:**

- Produces: `normalizePagination(input: { pn?: number; ps?: number }, maxPs?: number): { pn: number; ps: number; offset: number }`（默认 `pn = 1`、`ps = 10`、`maxPs = 100`，非法/越界值夹取）。

- [ ] **Step 1: 确认分支并安装依赖**

```bash
# feat/nextjs-migration 分支已由控制器创建，不要重复 git switch -c
bun add next@15 react react-dom
bun add -d @types/node @types/react@19 @types/react-dom@19 vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

预期：`package.json` 出现 Next/React/Vitest 依赖，`bun.lock` 更新。

- [ ] **Step 2: 写失败的测试**

`tests/lib/pagination.test.ts`：

```ts
import { describe, expect, test } from 'vitest';

import { normalizePagination } from '@/lib/pagination';

describe('normalizePagination', () => {
  test('defaults to page 1 and size 10', () => {
    expect(normalizePagination({})).toEqual({ pn: 1, ps: 10, offset: 0 });
  });
  test('clamps invalid and oversized input', () => {
    expect(normalizePagination({ pn: 0, ps: 500 })).toEqual({ pn: 1, ps: 100, offset: 0 });
    expect(normalizePagination({ pn: 3, ps: 20 })).toEqual({ pn: 3, ps: 20, offset: 40 });
  });
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `bunx vitest run tests/lib/pagination.test.ts`
Expected: FAIL，提示找不到 `@/lib/pagination`。

- [ ] **Step 4: 配置 Next/TS/Vitest 并实现工具函数**

`next.config.ts`：

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  serverExternalPackages: ['sequelize', 'sqlite3'],
};

export default nextConfig;
```

`tsconfig.json` 用 Next 预设覆盖，保留 `strict: false`，并排除旧代码：

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "allowJs": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "incremental": true,
    "skipLibCheck": true,
    "strict": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "src", "packages", "dist", ".next"]
}
```

`vitest.config.ts`：

```ts
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
```

`tests/setup.ts`：

```ts
import '@testing-library/jest-dom/vitest';

process.env.AUTH_SECRET ||= 'test-secret';
```

`lib/pagination.ts`：

```ts
export interface PaginationInput {
  pn?: number;
  ps?: number;
}
export interface Pagination {
  pn: number;
  ps: number;
  offset: number;
}

export function normalizePagination(input: PaginationInput, maxPs = 100): Pagination {
  const pn = Number.isInteger(input.pn) && (input.pn as number) > 0 ? (input.pn as number) : 1;
  const ps = Number.isInteger(input.ps) && (input.ps as number) > 0 ? Math.min(input.ps as number, maxPs) : 10;
  return { pn, ps, offset: (pn - 1) * ps };
}
```

`app/layout.tsx` 最小根布局（引用 `globals.css`，`lang="zh-CN"`）；`app/page.tsx` 返回占位标题；`app/globals.css` 先写最小 reset。`.env.example` 写 `DATABASE_PATH=./data/mtm.sqlite`、`AUTH_SECRET=change-me`。

`package.json` scripts 改为：

```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"test": "vitest run",
"test:watch": "vitest",
"lint": "oxlint",
"lint:fix": "oxlint --fix",
"typecheck": "tsc --noEmit",
"fmt": "oxfmt",
"fmt:check": "oxfmt --check"
```

`.gitignore` 增加 `.next/`、`data/*.sqlite*`。oxlint/oxfmt 的 `ignorePatterns` 增加 `.next`、`src`、`packages`、`dist`。

- [ ] **Step 5: 运行测试与构建**

Run: `bunx vitest run tests/lib/pagination.test.ts && bun run typecheck && bun run build`
Expected: 测试 PASS；`tsc` 无错误；`next build` 成功生成 standalone 产物。

- [ ] **Step 6: 提交**

```bash
git add package.json bun.lock tsconfig.json .gitignore .oxlintrc.jsonc .oxfmtrc.jsonc next.config.ts app tests vitest.config.ts lib/pagination.ts .env.example
git commit -m "feat(next): 初始化 Next.js 应用与测试基线"
```

---

### Task 2: 设计令牌、Providers 与 Toast

**Files:**

- Create: `styles/tokens.css`
- Create: `styles/reset.css`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`（用 `<Providers>` 包裹 `{children}`）
- Create: `app/providers.tsx`
- Create: `components/ui/Toast/index.tsx`
- Create: `components/ui/Toast/Toast.module.css`
- Create: `components/ui/index.ts`
- Create: `tests/components/Toast.test.tsx`

**Interfaces:**

- Produces:
  - `ToastProvider({ children }: { children: React.ReactNode })`
  - `useToast(): { success(message: string): void; error(message: string): void; info(message: string): void }`
  - CSS 变量：`--color-primary`、`--color-text`、`--color-text-secondary`、`--color-border`、`--color-bg`、`--color-success`、`--color-warning`、`--color-danger`、`--color-info`、`--space-1..8`、`--radius-sm/md/lg`、`--shadow-md`。

- [ ] **Step 1: 安装依赖**

```bash
bun add @tanstack/react-query zustand @base-ui-components/react lucide-react
```

- [ ] **Step 2: 写失败的测试**

`tests/components/Toast.test.tsx`：

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

import { ToastProvider, useToast } from '@/components/ui/Toast';

function Trigger() {
  const toast = useToast();
  return <button onClick={() => toast.success('已保存')}>go</button>;
}

test('shows a success toast', async () => {
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>
  );
  await userEvent.click(screen.getByText('go'));
  expect(await screen.findByText('已保存')).toBeInTheDocument();
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `bunx vitest run tests/components/Toast.test.tsx`
Expected: FAIL，找不到 `@/components/ui/Toast`。

- [ ] **Step 4: 实现样式令牌、Providers 与 Toast**

`styles/tokens.css` 定义上述 CSS 变量（品牌色沿用旧 Antd 主题色，取 `src/styles/theme.ts` 的值）。`styles/reset.css` 做 box-sizing、margin、字体、按钮/输入继承。`app/globals.css` 依次 `@import` 两个文件。

`app/providers.tsx`（`'use client'`）：创建 `QueryClient`（`staleTime: 30_000`、`refetchOnWindowFocus: false`），组合 `QueryClientProvider` 与 `ToastProvider`。`app/layout.tsx` 用 `<Providers>{children}</Providers>` 包裹页面内容，确保所有 client 组件都能拿到 QueryClient 与 Toast context。

`components/ui/Toast/index.tsx`（`'use client'`）：用 `useState` 维护 toast 队列，`setTimeout` 3 秒移除；渲染固定定位容器；`ToastProvider` 提供 `useToast` context。`Toast.module.css` 定义容器与三种状态样式。

- [ ] **Step 5: 运行测试与构建**

Run: `bunx vitest run tests/components/Toast.test.tsx && bun run typecheck && bun run build`
Expected: PASS，构建成功。

- [ ] **Step 6: 提交**

```bash
git add styles app components/ui tests/components/Toast.test.tsx package.json bun.lock
git commit -m "feat(ui): 添加设计令牌、Providers 与 Toast"
```

---

### Task 3: Sequelize 连接与健康检查

**Files:**

- Create: `lib/db/config.ts`
- Create: `lib/db/index.ts`
- Create: `lib/db/models/seed-meta.ts`
- Create: `lib/db/models/index.ts`
- Create: `lib/db/seed/index.ts`（占位 `seedDatabase`，Task 4 实现）
- Create: `app/api/health/route.ts`
- Create: `tests/lib/db/init.test.ts`

**Interfaces:**

- Produces:
  - `sequelize: Sequelize`
  - `initDatabase(): Promise<void>`（`sync()` + 种子；可重复调用）
  - `SeedMeta` 模型（`version: string`、`appliedAt: Date`）
  - `GET /api/health` → `{ code: 0, message: 'ok', data: { db: true } }`

- [ ] **Step 1: 安装依赖**

```bash
bun add sequelize sqlite3
```

- [ ] **Step 2: 写失败的测试**

`tests/lib/db/init.test.ts`：

```ts
import { afterAll, expect, test } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

const { sequelize, initDatabase } = await import('@/lib/db');
const { SeedMeta } = await import('@/lib/db/models');

afterAll(async () => {
  await sequelize.close();
});

test('initDatabase is idempotent', async () => {
  await initDatabase();
  await initDatabase();
  expect(await SeedMeta.findOne({ where: { version: 'bootstrap' } })).not.toBeNull();
  const [rows] = await sequelize.query('SELECT 1 AS ok');
  expect(rows).toBeTruthy();
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `bunx vitest run tests/lib/db/init.test.ts`
Expected: FAIL，找不到 `@/lib/db`。

- [ ] **Step 4: 实现连接与模型注册表**

`lib/db/config.ts`：

```ts
export function getDatabasePath(): string {
  return process.env.DATABASE_PATH || './data/mtm.sqlite';
}
```

`lib/db/index.ts`：创建 `new Sequelize({ dialect: 'sqlite', storage: getDatabasePath(), logging: false, pool: { max: 1 } })`。`pool.max = 1` 是必需的：`:memory:` 数据库在多个连接之间不共享数据，单连接保证测试与 `sequelize.sync()` 看到同一份数据；文件数据库使用单连接也不会成为瓶颈（单实例演示应用）。当路径不是 `:memory:` 时，先 `mkdir -p` 父目录。开发环境把实例挂到 `globalThis` 防止 HMR 重建；`initDatabase()` 用模块级 `let initPromise` 缓存初始化 Promise，先 `import './models'` 注册全部模型与关联，再 `sequelize.sync()`，插入幂等的 `SeedMeta` 记录 `version: 'bootstrap'`，最后调用 `seedDatabase()`（Task 4 实现，先用空函数占位并导出）。

`lib/db/models/seed-meta.ts`：`SeedMeta.init({ version: STRING, appliedAt: DATE }, { sequelize, tableName: 'seed_meta' })`。

`lib/db/models/index.ts` 统一 re-export。

`app/api/health/route.ts`：`await initDatabase()`；`await sequelize.query('SELECT 1')`；返回 `NextResponse.json({ code: 0, message: 'ok', data: { db: true } })`。

- [ ] **Step 5: 运行测试与构建**

Run: `bunx vitest run tests/lib/db/init.test.ts && bun run typecheck && bun run build`
Expected: PASS，构建成功。

- [ ] **Step 6: 提交**

```bash
git add lib/db app/api/health tests/lib/db package.json bun.lock
git commit -m "feat(db): 初始化 Sequelize 连接与健康检查"
```

---

### Task 4: 核心模型与幂等种子

**Files:**

- Create: `lib/db/models/account.ts`
- Create: `lib/db/models/merchant.ts`
- Create: `lib/db/models/menu.ts`
- Create: `lib/db/models/reference.ts`
- Create: `lib/db/models/registration.ts`
- Modify: `lib/db/models/index.ts`
- Create: `lib/db/seed/data/main/**`（复制 `public/api/**`）
- Create: `lib/db/seed/transformers.ts`
- Create: `lib/db/seed/core.ts`
- Create: `lib/db/seed/index.ts`
- Modify: `lib/db/index.ts`（接入种子）
- Create: `tests/lib/db/core-seed.test.ts`

**Interfaces:**

- 模型：
  - `Account`：`id, login, mobile, interCode, merchantId`
  - `Merchant`：`id, name, status, type, payload(JSON)`
  - `MerchantCategory`：`id, parentId, name, level`
  - `MerchantLicense`：`id, merchantId, type, name, url, status, expireAt`
  - `MerchantEntry`：`merchantId, step, status, payload(JSON)`
  - `EntryTask`：`id, merchantId, bizType, localCommerce, status`
  - `EntryType`：`code, name, templateUrl, payload(JSON)`
  - `MenuItem`：`id, parentId, title, icon, url, code, auth, index, level, sortId, toolMenu`
  - `MenuBadge`：`menuId, actionType, noticeStyle, noticeContent`
  - `MenuPreference`：`accountId, menuId, visible, sortIndex`
  - `MenuFavorite`：`accountId, menuId, sortIndex`
  - `ReferenceData`：`key (unique), payload(JSON)`
  - `Registration`：`id, interCode, mobile, status`
  - `Invitation`：`id, code, mobile, usedAt`
- Produces: `seedDatabase(): Promise<void>`；`SeedMeta.version = '2026-11-03-core'`。

- [ ] **Step 1: 复制种子数据**

```bash
mkdir -p lib/db/seed/data/main
cp -R public/api/. lib/db/seed/data/main/
```

- [ ] **Step 2: 写失败的测试**

`tests/lib/db/core-seed.test.ts`：

```ts
import { afterAll, expect, test } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

const { sequelize, initDatabase } = await import('@/lib/db');
const { Account, MenuItem, MenuFavorite, MerchantCategory, SeedMeta } = await import('@/lib/db/models');

afterAll(async () => {
  await sequelize.close();
});

test('seeds core entities exactly once', async () => {
  await initDatabase();
  await initDatabase();
  expect(await MenuItem.count()).toBe(54);
  expect(await MenuFavorite.count()).toBe(10);
  expect(await MerchantCategory.count()).toBe(173);
  const account = await Account.findOne({ where: { mobile: '13412345678' } });
  expect(account?.interCode).toBe('86');
  expect(await SeedMeta.findOne({ where: { version: '2026-11-03-core' } })).not.toBeNull();
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `bunx vitest run tests/lib/db/core-seed.test.ts`
Expected: FAIL，模型不存在或计数为 0。

- [ ] **Step 4: 实现模型、转换器与种子**

模型统一使用 `Model.init`，公共选项：`sequelize`、`tableName`、`underscored: true`、`timestamps: false`（除业务需要外）。JSON 列用 `DataTypes.JSON`。

`transformers.ts` 导出纯函数：

- `transformMenu(raw: unknown): { items: MenuItemRow[]; favorites: MenuItemRow[] }`
- `transformCategories(raw: unknown): MerchantCategoryRow[]`
- `transformMerchantList(raw: unknown): MerchantRow[]`
- `transformMerchantDetail(raw: unknown): MerchantRow`
- `transformAccount(raw: unknown): AccountRow`
- `transformLicenses(raw: unknown): MerchantLicenseRow[]`
- `transformEntry(raw: unknown): MerchantEntryRow`
- `transformEntryTask(raw: unknown): EntryTaskRow`
- `transformEntryTypes(raw: unknown): EntryTypeRow[]`

种子身份映射是固定契约（Task 5 的测试依赖它）：

- `Account` 行主键固定为 `1`，字段取设计文档：`{ id: 1, login: 'mt087320v', mobile: '13412345678', interCode: '86', merchantId: 1 }`；`transformAccount` 不要采用 `account/get.json` 里的 `id: 160474295`。
- `Merchant` 行主键固定为 `1`，名称等列字段从 `merchant/detail/get.json` 提取，完整原始详情放进 `payload`；`payload.id` 保留 `123456`，因此 `getMerchant(1)` 返回 DTO 的 `id` 为 `123456`。
- `Merchant` 的列表数据（`merchant/list/get.json`，id `108781`）单独入库，主键使用其自身 id；它与登录账号绑定的 demo merchant 是两条记录。
- `MenuFavorite` 的 `accountId` 固定为 `1`，与 `menu/get` 的 10 个收藏顺序一致。

`core.ts`：按固定顺序 `bulkCreate(rows, { ignoreDuplicates: true })` 或 `findOrCreate`，所有 ID 固定；插入后写入 `SeedMeta` 版本。`index.ts` 的 `seedDatabase()` 按版本独立判断（先查 `SeedMeta` 的 core 版本，已应用则跳过 core；营销种子在 Task 6 以同样方式独立判断），不要因为 core 已应用就提前 return。

- [ ] **Step 5: 运行测试与构建**

Run: `bunx vitest run tests/lib/db/core-seed.test.ts && bun run typecheck && bun run build`
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add lib/db tests/lib/db/core-seed.test.ts
git commit -m "feat(db): 添加核心模型与幂等种子"
```

---

### Task 5: 核心服务层

**Files:**

- Create: `lib/errors.ts`
- Create: `lib/api-response.ts`
- Create: `lib/menu-tree.ts`
- Create: `lib/services/account.ts`
- Create: `lib/services/menu.ts`
- Create: `lib/services/merchant.ts`
- Create: `lib/services/entry.ts`
- Create: `lib/services/registration.ts`
- Create: `lib/services/reference-data.ts`
- Create: `lib/validation/common.ts`
- Create: `tests/lib/services/core.test.ts`

**Interfaces:**

- `AppError`：`{ code: string; status: number; message: string }`，构造 `new AppError(code, status, message)`。
- `ok<T>(data: T): NextResponse<{ code: 0; message: 'ok'; data: T }>`
- `fail(error: unknown): NextResponse<{ code: string; message: string; data: null }>`：`AppError` 直接映射 `code/status/message`；同时兼容带 `{ code: string; status: number; message: string }` 形状的普通 Error（Task 9 的 mock 会这样注入）；未知错误返回 `{ code: 'INTERNAL_ERROR', status: 500 }`。
- `getAccount(accountId: number): Promise<AccountDTO>`
- `upsertAccount(input: { interCode: string; mobile: string }): Promise<AccountDTO>`
- `getMenu(accountId: number): Promise<{ menuItems: MenuItemDTO[]; favorites: MenuItemDTO[] }>`
- `updateMenuFavorites(accountId: number, favorites: { id: string }[]): Promise<MenuItemDTO[]>`
- `getMenuBadges(): Promise<MenuBadgeDTO[]>`
- `getMerchant(merchantId: number): Promise<MerchantDTO>`
- `listMerchants(params: PaginationInput): Promise<{ total: number; list: MerchantDTO[] }>`
- `getCategories(parentId?: number): Promise<MerchantCategoryDTO[]>`
- `getMerchantOptions(): Promise<Record<string, unknown>>`
- `listLicenses(merchantId: number): Promise<LicenseDTO[]>`
- `signContract(merchantId: number, input: { name: string; idCard: string }): Promise<void>`
- `getEntry(merchantId: number, entryTaskId?: number): Promise<EntryDTO>`
- `updateEntry(merchantId: number, input: Partial<EntryDTO>): Promise<EntryDTO>`
- `getEntryTask(merchantId: number): Promise<EntryTaskDTO>`
- `getEntryTypes(): Promise<EntryTypeDTO[]>`
- `getEntryTemplateUrl(type: string): Promise<{ url: string }>`
- `register(input: { interCode: string; mobile: string; captcha?: string }): Promise<void>`
- `getReferenceData<T>(key: string): Promise<T>`
- DTO 类型定义在各 service 文件内并导出；`MenuItemDTO` 与原 `IMenuItem` 字段一致，`last?: boolean`。

- [ ] **Step 1: 写失败的测试**

`tests/lib/services/core.test.ts`：

```ts
import { afterAll, expect, test } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

const { sequelize, initDatabase } = await import('@/lib/db');
const { getMenu, updateMenuFavorites } = await import('@/lib/services/menu');
const { getMerchant } = await import('@/lib/services/merchant');

afterAll(async () => {
  await sequelize.close();
});

test('menu tree marks the last root item', async () => {
  await initDatabase();
  const { menuItems, favorites } = await getMenu(1);
  expect(menuItems.length).toBeGreaterThan(0);
  expect(menuItems.at(-1)?.last).toBe(true);
  expect(favorites).toHaveLength(10);
});

test('rejects an 11th favorite', async () => {
  const eleven = Array.from({ length: 11 }, (_, i) => ({ id: String(i + 1) }));
  await expect(updateMenuFavorites(1, eleven)).rejects.toMatchObject({ code: 'MAX_FAVORITES' });
});

test('returns merchant detail', async () => {
  const merchant = await getMerchant(1);
  expect(merchant.id).toBe(123456);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run tests/lib/services/core.test.ts`
Expected: FAIL，service 不存在。

- [ ] **Step 3: 实现服务层**

- `lib/menu-tree.ts`：移植旧的 `listToTree`，按 `index` 排序，标记最后一个根节点 `last = true`。
- `lib/services/menu.ts`：查询 `MenuItem` 全量 → 建树；查询 `MenuFavorite` 关联菜单项；`updateMenuFavorites` 校验长度 ≤ 10、去重、事务内删除旧收藏并插入新顺序。
- `lib/services/merchant.ts`：详情从 `Merchant.payload` 合并列字段；列表分页；类目按 `parentId` 过滤；合同签署写 `Merchant.payload.contract`（JSON）。
- `lib/services/entry.ts`：读写 `MerchantEntry.payload`，任务与类型查对应表/引用数据。
- `lib/services/reference-data.ts`：按 key 取 `ReferenceData.payload`。
- `lib/services/registration.ts`：写入 `Registration`（幂等，按 `interCode + mobile` 唯一）。
- `lib/validation/common.ts`：`paginationSchema = z.object({ pn: z.coerce.number().int().positive().optional(), ps: z.coerce.number().int().positive().max(100).optional() })`。

- [ ] **Step 4: 运行测试与构建**

Run: `bunx vitest run tests/lib/services/core.test.ts && bun run typecheck`
Expected: PASS，无类型错误。

- [ ] **Step 5: 提交**

```bash
git add lib tests/lib/services/core.test.ts
git commit -m "feat(service): 实现核心业务服务层"
```

---

### Task 6: 营销模型与种子

**Files:**

- Create: `lib/db/models/coupon.ts`
- Create: `lib/db/models/campaign.ts`
- Create: `lib/db/models/message.ts`
- Create: `lib/db/models/violation.ts`
- Create: `lib/db/models/product.ts`
- Create: `lib/db/models/gold.ts`
- Create: `lib/db/models/merchant-task.ts`
- Create: `lib/db/models/analysis.ts`
- Modify: `lib/db/models/index.ts`
- Create: `lib/db/seed/data/market/**`（复制 `packages/mtm_market/public/api/**`）
- Modify: `lib/db/seed/transformers.ts`
- Create: `lib/db/seed/marketing.ts`
- Modify: `lib/db/seed/index.ts`
- Create: `tests/lib/db/marketing-seed.test.ts`

**Interfaces:**

- `Coupon` 超集列：`id, name, displayName, type, target, status, ctime, stime, etime, price, discount, validDays, validStime, validEtime, sendCount, leftCount, stock, limit, putCrowd, useCrowd, position, ticketType, rule(JSON), putTerm(JSON), useTerm(JSON), spuList(JSON), spuIds(JSON), wmPoiIds(JSON)`。
- `Campaign, Message, Violation, Product, GoldPeriod, GoldStandard, MerchantTask, AnalysisSnapshot` 字段按对应 mock 的 data 结构落列或 JSON。
- Produces: `seedMarketing(): Promise<void>`，`SeedMeta.version = '2026-11-03-marketing'`。

- [ ] **Step 1: 复制市场种子数据**

```bash
mkdir -p lib/db/seed/data/market
cp -R packages/mtm_market/public/api/. lib/db/seed/data/market/
```

- [ ] **Step 2: 写失败的测试**

`tests/lib/db/marketing-seed.test.ts`：

```ts
import { afterAll, expect, test } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

const { sequelize, initDatabase } = await import('@/lib/db');
const { Coupon, Campaign, Message, Violation, Product } = await import('@/lib/db/models');

afterAll(async () => {
  await sequelize.close();
});

test('seeds marketing data', async () => {
  await initDatabase();
  expect(await Coupon.count()).toBe(11); // 列表 10 条 + 详情独有 1070734573
  expect(await Campaign.count()).toBeGreaterThan(0);
  expect(await Message.count()).toBeGreaterThan(0);
  expect(await Violation.count()).toBeGreaterThan(0);
  expect(await Product.count()).toBeGreaterThan(0);
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `bunx vitest run tests/lib/db/marketing-seed.test.ts`
Expected: FAIL。

- [ ] **Step 4: 实现营销模型与种子**

- 优惠券种子：每条列表记录补齐详情投影（`rule` 由 `price/discount` 推导为 `[price, discount]`；`stock` 用 `sendCount + leftCount`；`limit` 默认 1；`putTerm` 用 `[stime, etime]`；其余缺失字段给稳定默认值）。详情 mock 的 `1070734573` 单独 upsert。
- 其它实体按 JSON 直接映射；`AnalysisSnapshot` 的 key 为 `workbench | trending | operation`。
- 所有写入幂等（`findOrCreate` 或 `upsert`），完成后写 `SeedMeta`。
- `lib/db/seed/index.ts` 的 `seedDatabase()` 必须独立检查 core 与 marketing 两个版本：core 已应用只跳过 core，不能因此跳过 marketing（否则已有数据库升级后营销数据永远不落库）。

- [ ] **Step 5: 运行测试与构建**

Run: `bunx vitest run tests/lib/db/marketing-seed.test.ts && bun run typecheck`
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add lib/db tests/lib/db/marketing-seed.test.ts
git commit -m "feat(db): 添加营销模型与种子"
```

---

### Task 7: 营销服务层

**Files:**

- Create: `lib/services/coupon.ts`
- Create: `lib/services/campaign.ts`
- Create: `lib/services/message.ts`
- Create: `lib/services/violation.ts`
- Create: `lib/services/product.ts`
- Create: `lib/services/gold.ts`
- Create: `lib/services/merchant-task.ts`
- Create: `lib/services/analysis.ts`
- Create: `tests/lib/services/marketing.test.ts`

**Interfaces:**

- `CouponListItemDTO`：`id, name, type, target, stime, etime, price, discount, validDays, validStime, validEtime, sendCount, leftCount, status, useTerm, putTerm, ctime`
- `CouponDetailDTO`：在列表字段基础上增加 `displayName, rule, stock, limit, putCrowd, useCrowd, position, spuList, spuIds, wmPoiIds, ticketType`
- `listCoupons(query: { pn?: number; ps?: number; status?: number; stime?: number; etime?: number }): Promise<{ total: number; pn: number; ps: number; list: CouponListItemDTO[] }>`
- `getCoupon(id: string): Promise<CouponDetailDTO>`
- `createCoupon(input: CouponUpsertInput): Promise<CouponDetailDTO>`
- `updateCoupon(id: string, input: Partial<CouponUpsertInput>): Promise<CouponDetailDTO>`
- `offlineCoupon(id: string): Promise<CouponDetailDTO>`（`status = 6`）
- `listCampaigns(query): Promise<{ total: number; list: CampaignDTO[] }>`
- `getLatestMessages(): Promise<MessageBriefDTO[]>`、`getMessage(id): Promise<MessageDTO>`
- `getViolationOverview(): Promise<ViolationOverviewDTO>`
- `getSellingProduct(poiId?: number): Promise<{ total: number; items: ProductDTO[] }>`
- `getGold(poiId: number, periodType: number): Promise<GoldDTO>`
- `listMerchantTasks(poiId: number): Promise<MerchantTaskDTO[]>`
- `getWorkbench(): Promise<WorkbenchDTO>`、`getTrending(): Promise<TrendingDTO>`、`getOperation(): Promise<OperationDTO>`

- [ ] **Step 1: 写失败的测试**

`tests/lib/services/marketing.test.ts`：

```ts
import { afterAll, expect, test } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

const { sequelize, initDatabase } = await import('@/lib/db');
const { listCoupons, getCoupon, offlineCoupon } = await import('@/lib/services/coupon');

afterAll(async () => {
  await sequelize.close();
});

test('list total comes from the database, not the mock', async () => {
  await initDatabase();
  const res = await listCoupons({ pn: 1, ps: 10 });
  expect(res.total).toBe(11);
  expect(res.list).toHaveLength(10);
});

test('detail id absent from the list is still retrievable', async () => {
  const res = await getCoupon('1070734573');
  expect(res.rule).toEqual([100, 10]);
});

test('offlineCoupon sets status to 6', async () => {
  const res = await offlineCoupon('500145265');
  expect(res.status).toBe(6);
  const again = await getCoupon('500145265');
  expect(again.status).toBe(6);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run tests/lib/services/marketing.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现服务与 DTO 映射**

- `lib/services/coupon.ts`：两个 mapper `toCouponListItem(row)`、`toCouponDetail(row)`；列表查询按 `status` 与 `stime/etime` 过滤，`total` 用 `count`；`offlineCoupon` 在事务内更新状态并返回详情。
- 其余服务读取对应表/`ReferenceData`/`AnalysisSnapshot`，输出显式 DTO，不让 Sequelize 实例泄漏到页面。
- 所有时间字段返回 ISO 字符串；页面用 `dayjs` 格式化。

- [ ] **Step 4: 运行测试与构建**

Run: `bunx vitest run tests/lib/services/marketing.test.ts && bun run typecheck`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add lib/services tests/lib/services/marketing.test.ts
git commit -m "feat(service): 实现营销与数据分析服务"
```

---

### Task 8: 认证后端（验证码 + NextAuth + 中间件）

**Files:**

- Create: `lib/validation/phone.ts`
- Create: `lib/services/captcha.ts`
- Create: `app/api/captcha/route.ts`
- Create: `lib/auth.ts`
- Create: `lib/auth-guard.ts`
- Create: `types/next-auth.d.ts`
- Create: `middleware.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `scripts/session-cookie.ts`
- Create: `tests/lib/auth/captcha.test.ts`
- Create: `tests/lib/auth/phone.test.ts`

**Interfaces:**

- `isMobilePhone(value: string, interCode: string): boolean`（沿用旧正则：86/65/852/853/886）。
- `createCaptcha(mobile: string): { token: string; display: { mobile: number; captcha: number } }`
- `verifyCaptcha(token: string | undefined, input: string): boolean`
- `auth()`, `signIn()`, `signOut()`, `handlers` 来自 NextAuth。
- Session 扩展：`user.accountId: number`、`user.mobile: string`、`user.interCode: string`、`user.merchantId: number`、`user.login: string`。
- `requireAccount(): Promise<{ accountId: number; merchantId: number }>`（handler 用，未登录抛 `AppError('UNAUTHORIZED', 401)`）。
- Cookie：验证码 `mtm_captcha`（httpOnly，5 分钟）；NextAuth 默认会话 Cookie。
- `scripts/session-cookie.ts`：为种子账号打印 `authjs.session-token=<jwt>`，供 smoke/手工验证。

- [ ] **Step 1: 安装 NextAuth**

```bash
bun add next-auth
```

- [ ] **Step 2: 写失败的测试**

`tests/lib/auth/phone.test.ts`：

```ts
import { expect, test } from 'vitest';

import { isMobilePhone } from '@/lib/validation/phone';

test('accepts supported country codes', () => {
  expect(isMobilePhone('13412345678', '86')).toBe(true);
  expect(isMobilePhone('81234567', '65')).toBe(true);
  expect(isMobilePhone('61234567', '852')).toBe(true);
  expect(isMobilePhone('61234567', '853')).toBe(true);
  expect(isMobilePhone('123', '86')).toBe(false);
});
```

`tests/lib/auth/captcha.test.ts`：

```ts
import { expect, test } from 'vitest';

import { createCaptcha, verifyCaptcha } from '@/lib/services/captcha';

test('captcha round-trips and rejects wrong input', () => {
  const { token, display } = createCaptcha('13412345678');
  expect(verifyCaptcha(token, String(display.captcha))).toBe(true);
  expect(verifyCaptcha(token, '000000')).toBe(false);
  expect(verifyCaptcha(undefined, String(display.captcha))).toBe(false);
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `bunx vitest run tests/lib/auth`
Expected: FAIL。

- [ ] **Step 4: 实现认证**

- `lib/validation/phone.ts`：复制旧 `patterns`。
- `lib/services/captcha.ts`：随机生成 `100000`–`999999` 的 6 位数字（保证转成 number 展示时不会丢前导 0）；用 `jose` 的 `SignJWT` 以 `process.env.AUTH_SECRET` 签名，载荷 `{ mobile, captcha }`，5 分钟过期；`verifyCaptcha` 验签并比对。缺少 `AUTH_SECRET` 时直接抛错，不要在源码里写生产默认密钥（测试由 `tests/setup.ts` 注入）。
- `app/api/captcha/route.ts`：校验 mobile 非空 → `createCaptcha` → 通过 `cookies()` 写 `mtm_captcha` → 返回 `{ code: 0, message: 'ok', data: { mobile: Number(mobile), captcha } }`。
- `lib/auth.ts`：`NextAuth({ session: { strategy: 'jwt', maxAge: 2 * 60 * 60 }, providers: [Credentials({ credentials: {}, authorize(input) { ... } })] })`。`authorize` 校验 `interCode` 与 mobile 格式；验证码从请求 Cookie `mtm_captcha` 读取（`import { cookies } from 'next/headers'`），调用 `verifyCaptcha(token, input.captcha)`；页面通过 `signIn('credentials', { interCode, mobile, captcha, redirect: false })` 提交。成功后 `upsertAccount`，返回 `{ id, name: login, accountId, mobile, interCode, merchantId, login }`。
- `lib/auth-guard.ts`：`auth()` 取会话，无会话抛 `AppError('UNAUTHORIZED', 401)`。
- `middleware.ts`：用 `auth((req) => ...)`；未登录访问受保护页面时重定向 `/login?callbackUrl=...`；matcher **排除所有 `/api/*`**（API 的鉴权由 `withAuth` 负责，避免中间件把 401 变成 302）、`/login`、`/register`、`/settleinpc`、`/settleinjx`、`/_next`、静态资源。
- `scripts/session-cookie.ts`：导出 `createSessionCookie(): Promise<string>`（Cookie 头），并在文件被直接执行时打印 curl 可用的 Cookie 头；导入该模块时不要产生输出。用 `encode` from `next-auth/jwt` 为种子账号（`accountId: 1, merchantId: 1, mobile: '13412345678', interCode: '86', login: 'mt087320v'`）生成 `authjs.session-token`；`AUTH_SECRET` 必须已设置。

- [ ] **Step 5: 运行测试与构建**

Run: `bunx vitest run tests/lib/auth && bun run typecheck && bun run build`
Expected: PASS，构建成功。

- [ ] **Step 6: 提交**

```bash
git add lib/validation/phone.ts lib/services/captcha.ts app/api/captcha app/api/auth lib/auth.ts lib/auth-guard.ts types/next-auth.d.ts middleware.ts scripts/session-cookie.ts tests/lib/auth package.json bun.lock
git commit -m "feat(auth): 接入 NextAuth 与验证码"
```

---

### Task 9: 核心 Route Handlers

**Files:**

- Create: `lib/handler.ts`
- Create: `app/api/account/route.ts`
- Create: `app/api/menu/route.ts`
- Create: `app/api/menu/badges/route.ts`
- Create: `app/api/merchant/detail/route.ts`
- Create: `app/api/merchant/list/route.ts`
- Create: `app/api/merchant/category/route.ts`
- Create: `app/api/merchant/options/route.ts`
- Create: `app/api/merchant/licenses/route.ts`
- Create: `app/api/merchant/contract/sign/route.ts`
- Create: `app/api/merchant/entry/route.ts`
- Create: `app/api/merchant/entry/task/route.ts`
- Create: `app/api/merchant/entry/type/route.ts`
- Create: `app/api/merchant/entry/template-url/route.ts`
- Create: `app/api/register/route.ts`
- Create: `app/api/invitation/route.ts`
- Create: `tests/lib/handler.test.ts`

**Interfaces:**

- `withAuth<T>(handler: (ctx: { accountId: number; merchantId: number; request: Request; params: Record<string, string> }) => Promise<T>): (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>`
- `parseQuery<T>(request: Request, schema: ZodSchema<T>): T`
- `parseBody<T>(request: Request, schema: ZodSchema<T>): Promise<T>`
- 所有失败统一经 `fail()` 输出。

- [ ] **Step 1: 写失败的测试**

`tests/lib/handler.test.ts`：

```ts
import { expect, test, vi } from 'vitest';

vi.mock('@/lib/auth-guard', () => ({
  requireAccount: vi.fn().mockRejectedValue(Object.assign(new Error('未登录'), { code: 'UNAUTHORIZED', status: 401 })),
}));

const { withAuth } = await import('@/lib/handler');

test('returns 401 JSON for unauthenticated handlers', async () => {
  const handler = withAuth(async () => ({ ok: true }));
  const res = await handler(new Request('http://localhost/api/test'), { params: Promise.resolve({}) });
  expect(res.status).toBe(401);
  expect(await res.json()).toMatchObject({ code: 'UNAUTHORIZED', message: '未登录' });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run tests/lib/handler.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 handler 包装与接口**

`lib/handler.ts` 捕获 `AppError` 与未知错误；成功用 `ok()`，失败用 `fail()`；`params` 兼容 Next 15 的 Promise。

每个 route 只做：鉴权（如需）→ Zod 解析 → service → `ok`。公开接口（不调用 `withAuth`，固定使用 demo `merchantId = 1`）：`/api/register`、`/api/invitation`、`/api/merchant/entry`（GET/PATCH）、`/api/merchant/entry/task`、`/api/merchant/entry/type`、`/api/merchant/entry/template-url`、`/api/merchant/options`、`/api/merchant/category`。原因：`/settleinpc` 与 `/settleinjx/*` 是公开入驻页，必须能读取这些数据。其余核心接口用 `withAuth`。鉴权由 handler 负责，middleware 不拦截 `/api/*`。

- [ ] **Step 4: 用 dev server 验证**

Run: `bun run dev`，然后：

```bash
curl -s http://localhost:3000/api/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/menu
```

Expected: 健康检查 `code: 0`；未带会话的 `/api/menu` 返回 `401`。

- [ ] **Step 5: 运行测试与构建并提交**

```bash
bunx vitest run tests/lib/handler.test.ts && bun run typecheck && bun run build
git add lib/handler.ts app/api tests/lib/handler.test.ts
git commit -m "feat(api): 实现核心 Route Handlers"
```

---

### Task 10: 营销 Route Handlers

**Files:**

- Create: `app/api/merchant/coupon/route.ts`
- Create: `app/api/merchant/coupon/[id]/route.ts`
- Create: `app/api/merchant/campaigns/route.ts`
- Create: `app/api/merchant/gold/route.ts`
- Create: `app/api/merchant/task/list/route.ts`
- Create: `app/api/message/latest-news/route.ts`
- Create: `app/api/message/[id]/route.ts`
- Create: `app/api/product/selling/route.ts`
- Create: `app/api/violation/overview/route.ts`
- Create: `app/api/analysis/workbench/route.ts`
- Create: `app/api/analysis/trending/route.ts`
- Create: `app/api/analysis/operation/route.ts`
- Create: `tests/lib/services/coupon-handler.test.ts`

**Interfaces:**

- `GET/POST /api/merchant/coupon`
- `GET/PATCH/DELETE /api/merchant/coupon/[id]`（DELETE 调 `offlineCoupon`）
- 其余按设计文档第 9 节路径。

- [ ] **Step 1: 写失败的测试**

`tests/lib/services/coupon-handler.test.ts`（直接调用 handler，mock `requireAccount` 返回种子账号）：

```ts
import { expect, test, vi } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

vi.mock('@/lib/auth-guard', () => ({
  requireAccount: vi.fn().mockResolvedValue({ accountId: 1, merchantId: 1 }),
}));

const { initDatabase } = await import('@/lib/db');
const { GET, DELETE } = await import('@/app/api/merchant/coupon/[id]/route');

test('DELETE offlines a coupon', async () => {
  await initDatabase();
  const res = await DELETE(new Request('http://localhost/api/merchant/coupon/500145265', { method: 'DELETE' }), {
    params: Promise.resolve({ id: '500145265' }),
  });
  expect(res.status).toBe(200);
  expect((await res.json()).data.status).toBe(6);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run tests/lib/services/coupon-handler.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现营销 handlers 与 Zod schema**

`lib/validation/coupon.ts` 定义 `couponListQuerySchema`、`couponUpsertSchema`（名称非空、`stock >= 1`、`limit >= 1`、时间段合法）。所有 handler 复用 `withAuth`。

- [ ] **Step 4: 运行测试与构建并提交**

```bash
bunx vitest run tests/lib/services/coupon-handler.test.ts && bun run typecheck && bun run build
git add app/api lib/validation/coupon.ts tests/lib/services/coupon-handler.test.ts
git commit -m "feat(api): 实现营销 Route Handlers"
```

---

### Task 11: UI 基础组件（表单）

**Files:**

- Create: `components/ui/Button/index.tsx` + `components/ui/Button/Button.module.css`
- Create: `components/ui/Input/index.tsx` + `components/ui/Input/Input.module.css`
- Create: `components/ui/Textarea/index.tsx`
- Create: `components/ui/Select/index.tsx`
- Create: `components/ui/Checkbox/index.tsx`
- Create: `components/ui/Radio/index.tsx`
- Create: `components/ui/Switch/index.tsx`
- Create: `components/ui/Field/index.tsx` + `components/ui/Field/Field.module.css`
- Create: `components/ui/Form/index.tsx`
- Modify: `components/ui/index.ts`
- Create: `tests/components/Form.test.tsx`

**Interfaces:**

- `Button({ variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>)`
- `Input`, `Textarea` 转发原生属性；`Select({ options: { value: string | number; label: string }[]; value?: string | number; onChange?: (value: string | number) => void; placeholder?: string })`
- `Field({ label?: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode })`
- `Form({ schema, defaultValues, onSubmit, children })`：基于 RHF + Zod 的薄包装。
- `useFormField()`：供自定义字段读取 `error/disabled`。

- [ ] **Step 1: 安装表单依赖**

```bash
bun add react-hook-form @hookform/resolvers zod
```

- [ ] **Step 2: 写失败的测试**

`tests/components/Form.test.tsx`：

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';

const schema = z.object({ mobile: z.string().min(11, '手机号必须为 11 位') });

test('shows the zod message for invalid input', async () => {
  const onSubmit = vi.fn();
  render(
    <Form schema={schema} defaultValues={{ mobile: '' }} onSubmit={onSubmit}>
      <Field label='手机号'>
        <Input name='mobile' />
      </Field>
      <Button type='submit'>提交</Button>
    </Form>
  );
  await userEvent.click(screen.getByText('提交'));
  expect(await screen.findByText('手机号必须为 11 位')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByText('手机号必须为 11 位')).toBeInTheDocument());
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `bunx vitest run tests/components/Form.test.tsx`
Expected: FAIL。

- [ ] **Step 4: 实现组件**

- `Form` 用 `useForm` + `zodResolver`，通过 `FormProvider` 暴露；`Input` 等组件用 `useFormContext` 注册（`...register(name)`）。
- `Select` 基于 Base UI `Select`，保持受控接口与原生表单值兼容。
- 所有样式用 CSS Modules，颜色/间距引用 `styles/tokens.css` 变量。

- [ ] **Step 5: 运行测试与构建并提交**

```bash
bunx vitest run tests/components/Form.test.tsx && bun run typecheck && bun run build
git add components/ui tests/components/Form.test.tsx package.json bun.lock
git commit -m "feat(ui): 添加表单基础组件"
```

---

### Task 12: UI 基础组件（展示与覆盖层）

**Files:**

- Create: `components/ui/Dialog/index.tsx`, `components/ui/Drawer/index.tsx`, `components/ui/Tooltip/index.tsx`, `components/ui/Dropdown/index.tsx`, `components/ui/Popover/index.tsx`
- Create: `components/ui/Card/index.tsx`, `components/ui/Tag/index.tsx`, `components/ui/Badge/index.tsx`, `components/ui/Tabs/index.tsx`, `components/ui/Steps/index.tsx`
- Create: `components/ui/Pagination/index.tsx`, `components/ui/Empty/index.tsx`, `components/ui/Skeleton/index.tsx`
- Create: `components/ui/DataTable/index.tsx` + `components/ui/DataTable/DataTable.module.css`
- Create: `components/ui/LabelValue/index.tsx`
- Create: `components/ui/SearchForm/index.tsx`
- Modify: `components/ui/index.ts`
- Create: `tests/components/DataTable.test.tsx`

**Interfaces:**

- `DataTable<T>({ columns: ColumnDef<T>[]; data: T[]; total: number; page: number; pageSize: number; onPageChange: (page: number) => void; rowKey: keyof T | ((row: T) => string); loading?: boolean; emptyText?: string })`
- `Dialog({ open, onOpenChange, title, description?, children, footer? })`
- `Pagination({ page, pageSize, total, onPageChange })`
- `SearchForm({ children, onSubmit, onReset })`
- `LabelValue({ label, children, layout?: 'horizontal' | 'vertical' })`

- [ ] **Step 1: 安装表格依赖**

```bash
bun add @tanstack/react-table
```

- [ ] **Step 2: 写失败的测试**

`tests/components/DataTable.test.tsx`：

```tsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { DataTable } from '@/components/ui/DataTable';

const rows = Array.from({ length: 10 }, (_, i) => ({ id: String(i), name: `row-${i}` }));

test('renders the current page and total', () => {
  render(
    <DataTable
      columns={[{ accessorKey: 'name', header: '名称' }]}
      data={rows}
      total={25}
      page={1}
      pageSize={10}
      onPageChange={() => {}}
      rowKey='id'
    />
  );
  expect(screen.getByText('row-0')).toBeInTheDocument();
  expect(screen.getByText('共 25 条')).toBeInTheDocument();
  expect(screen.queryByText('row-10')).not.toBeInTheDocument();
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `bunx vitest run tests/components/DataTable.test.tsx`
Expected: FAIL。

- [ ] **Step 4: 实现组件**

- `DataTable` 用 `useReactTable`（`getCoreRowModel`），列头/单元格由 CSS Modules 控制；分页栏显示 `共 {total} 条` 并回调 `onPageChange`。
- 覆盖层组件基于 Base UI `Dialog/Popover/Tooltip/Menu`，统一 `z-index` 变量。
- `Tag`/`Badge` 支持 `tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'`，用于替代旧的状态色映射。

- [ ] **Step 5: 运行测试与构建并提交**

```bash
bunx vitest run tests/components/DataTable.test.tsx && bun run typecheck && bun run build
git add components/ui tests/components/DataTable.test.tsx package.json bun.lock
git commit -m "feat(ui): 添加展示与覆盖层组件"
```

---

### Task 13: 管理端外壳与菜单

**Files:**

- Create: `components/layout/AdminShell/index.tsx` + `components/layout/AdminShell/AdminShell.module.css`
- Create: `components/layout/Sidebar/index.tsx` + `components/layout/Sidebar/Sidebar.module.css`
- Create: `components/layout/SidebarMenu/index.tsx`
- Create: `components/layout/TitleWithBadge/index.tsx`
- Create: `components/layout/Header/index.tsx`
- Create: `components/layout/Breadcrumbs/index.tsx`
- Create: `components/layout/PageContainer/index.tsx` + `components/layout/PageContainer/PageContainer.module.css`
- Create: `stores/ui.ts`
- Create: `lib/menu/favorites.ts`
- Create: `lib/api-client.ts`
- Create: `lib/query-keys.ts`
- Create: `app/(admin)/layout.tsx`
- Create: `app/(admin)/page.tsx`（最小占位页，Task 15 替换为仪表盘）
- Create: `app/not-found.tsx`
- Delete: `app/page.tsx`
- Create: `tests/lib/menu/favorites.test.ts`

**Interfaces:**

- `toggleFavorite(favorites: MenuItemDTO[], item: MenuItemDTO, max = 10): MenuItemDTO[]`（已存在则移除；否则追加；超过上限抛 `AppError('MAX_FAVORITES', 400)`）。
- `apiFetch<T>(path: string, init?: RequestInit & { query?: Record<string, unknown>; body?: unknown }): Promise<T>`（解析 `{ code, message, data }`，非 0 抛 `ApiError`）。
- `queryKeys`：`account`、`menu`、`menuBadges`、`merchant`、`coupons(params)`、`coupon(id)`、`campaigns`、`messages`、`violationOverview`、`analysis(key)`。
- `useUiStore`：`sidebarCollapsed`、`toggleSidebar()`、`sidebarEditMode`、`setSidebarEditMode()`。
- `AdminShell({ menuItems, favorites, badges, account, children })`。

- [ ] **Step 1: 写失败的测试**

`tests/lib/menu/favorites.test.ts`：

```ts
import { expect, test } from 'vitest';

import { toggleFavorite } from '@/lib/menu/favorites';

const item = (id: string) => ({ id }) as never;

test('adds, removes, and caps favorites', () => {
  expect(toggleFavorite([], item('1'))).toHaveLength(1);
  expect(toggleFavorite([item('1')], item('1'))).toHaveLength(0);
  const ten = Array.from({ length: 10 }, (_, i) => item(String(i)));
  expect(() => toggleFavorite(ten, item('x'))).toThrow();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run tests/lib/menu/favorites.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现外壳**

- `app/(admin)/layout.tsx`（RSC）：`const session = await auth(); if (!session) redirect('/login')`；调用 `getMenu`、`getMenuBadges`、`getAccount`；把数据传给 `AdminShell`（client）。
- `Sidebar`：渲染收藏夹（可编辑模式，最多 10，保存调 `PATCH /api/menu`）、菜单树、角标；折叠状态来自 `useUiStore`。
- `Header`：账号下拉（手机号/退出登录）；退出调用 `signOut({ callbackUrl: '/login' })`。
- `PageContainer`：标题、描述、面包屑、右侧操作区。
- `app/(admin)/page.tsx` 先放最小占位内容（保证 `/` 在 Task 15 之前就能渲染外壳），Task 15 再替换为仪表盘。
- `app/not-found.tsx` 提供中文 404 文案与返回 `/` 的链接；未迁移菜单链接直接使用 `<Link>`，目标不存在时落到这里。

- [ ] **Step 4: 运行测试与构建**

Run: `bunx vitest run tests/lib/menu/favorites.test.ts && bun run typecheck && bun run build`
Expected: PASS。

- [ ] **Step 5: 用会话 Cookie 验证外壳**

```bash
bun run dev
COOKIE=$(bun scripts/session-cookie.ts)
curl -s -H "Cookie: $COOKIE" http://localhost:3000/ | grep -q "常用功能"
```

Expected: 输出包含“常用功能”。

- [ ] **Step 6: 提交**

```bash
git add components/layout components/ui stores lib/menu lib/api-client.ts lib/query-keys.ts app tests/lib/menu
git commit -m "feat(layout): 实现管理端外壳与菜单"
```

---

### Task 14: 登录、注册与成功页

**Files:**

- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `app/(auth)/register/success/page.tsx`
- Create: `components/auth/LoginForm/index.tsx` + `components/auth/LoginForm/LoginForm.module.css`
- Create: `components/auth/RegisterForm/index.tsx`
- Create: `components/auth/CaptchaField/index.tsx`
- Create: `lib/validation/auth.ts`
- Create: `tests/lib/auth/schema.test.ts`
- Create: `tests/components/LoginForm.test.tsx`

**Interfaces:**

- `loginSchema`：`{ interCode: '86' | '65' | '852' | '853'; mobile: string; captcha: string }`，`mobile` 经 `isMobilePhone` 按区号校验。
- `registerSchema`：在 `loginSchema` 基础上增加 `policy: true`。
- `LoginForm`：提交调 `signIn('credentials', { interCode, mobile, captcha, redirect: false })`；成功后 `router.replace(safeCallbackUrl(callbackUrl))`。`safeCallbackUrl` 只接受以单个 `/` 开头且不以 `//` 开头的站内路径，否则回退 `/`（避免开放重定向）。
- `CaptchaField`：调 `/api/captcha`，用 `useToast().success()` 展示验证码文案（沿用旧文案格式）。
- `useSearchParams` 必须位于 `<Suspense>` 内；在 `app/(auth)/login/page.tsx` 用 Suspense 包住 `LoginForm`（或在服务端读取 `searchParams` 后作为 prop 传入）。

- [ ] **Step 1: 写失败的测试**

`tests/lib/auth/schema.test.ts`：

```ts
import { expect, test } from 'vitest';

import { loginSchema } from '@/lib/validation/auth';

test('validates per country code', () => {
  expect(loginSchema.safeParse({ interCode: '86', mobile: '13412345678', captcha: '123456' }).success).toBe(true);
  expect(loginSchema.safeParse({ interCode: '65', mobile: '81234567', captcha: '123456' }).success).toBe(true);
  expect(loginSchema.safeParse({ interCode: '852', mobile: '61234567', captcha: '123456' }).success).toBe(true);
  expect(loginSchema.safeParse({ interCode: '853', mobile: '61234567', captcha: '123456' }).success).toBe(true);
  expect(loginSchema.safeParse({ interCode: '86', mobile: '123', captcha: '123456' }).success).toBe(false);
});
```

`tests/components/LoginForm.test.tsx`（mock `next-auth/react` 与 `next/navigation`）：至少断言两件事：

1. 输入非法手机号并提交时不调用 `signIn`，页面出现手机号校验错误。
2. 填入 `interCode: '86'`、`mobile: '13412345678'`、`captcha: '123456'` 后提交，`signIn` 被调用且参数包含 `{ interCode: '86', mobile: '13412345678', captcha: '123456', redirect: false }`。

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run tests/lib/auth/schema.test.ts tests/components/LoginForm.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 实现页面与表单**

- 登录页保持旧结构：区号 Select + 手机号 Input + 验证码 + 提交。
- 注册页提交 `/api/register`，成功后跳 `/register/success`。
- 表单错误用 `Field` 展示；验证码错误提示“验证码错误”。
- 页面为 client component（需要 `signIn`/router），外层 `(auth)/layout.tsx` 提供居中卡片布局。

- [ ] **Step 4: 运行测试与构建**

Run: `bunx vitest run tests/lib/auth/schema.test.ts tests/components/LoginForm.test.tsx && bun run typecheck && bun run build`
Expected: PASS。

- [ ] **Step 5: 手工验证登录**

```bash
bun run dev
```

浏览器打开 `/login`：选择 +86，输入 `13412345678`，点“获取验证码”，从 toast 取码，提交后进入 `/`。再试 +65 与 `81234567`。

- [ ] **Step 6: 提交**

```bash
git add app/'(auth)' components/auth lib/validation/auth.ts tests/lib/auth tests/components/LoginForm.test.tsx
git commit -m "feat(auth): 迁移登录与注册页面"
```

---

### Task 15: 首页仪表盘（第一批组件）

**Files:**

- Modify: `app/(admin)/page.tsx`（Task 13 的占位页替换为仪表盘）
- Create: `components/dashboard/DashboardGrid/index.tsx` + `components/dashboard/DashboardGrid/DashboardGrid.module.css`
- Create: `components/market/remotes/LatestNews/index.tsx` + `components/market/remotes/LatestNews/LatestNews.module.css`
- Create: `components/market/remotes/Overview/index.tsx`
- Create: `components/market/remotes/Realdata/index.tsx`
- Create: `components/market/remotes/Workbench/index.tsx`
- Modify: `components/ui/index.ts`（如需导出 Grid）
- Create: `tests/lib/services/analysis.test.ts`

**Interfaces:**

- 每个 remote 默认导出组件，props 兼容旧用法：`{ className?: string; style?: React.CSSProperties; bodyStyle?: React.CSSProperties }`。
- 数据通过 `useQuery({ queryKey: queryKeys.analysis('latest-news'), queryFn: () => apiFetch(...) })` 获取。
- `DashboardGrid`：使用 CSS Grid 复刻旧 `Row/Col` 的 24 栅格布局（12/12 两列，24 单列）。

- [ ] **Step 1: 写失败的测试**

`tests/lib/services/analysis.test.ts`：

```ts
import { afterAll, expect, test } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

const { sequelize, initDatabase } = await import('@/lib/db');
const { getWorkbench } = await import('@/lib/services/analysis');

afterAll(async () => {
  await sequelize.close();
});

test('workbench exposes overview and realdata', async () => {
  await initDatabase();
  const res = await getWorkbench();
  expect(res.overview.unpaidOrderCount).toBeTypeOf('number');
  expect(res.realdata.paidOrderCount).toBeTypeOf('number');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run tests/lib/services/analysis.test.ts`
Expected: FAIL（若 Task 7 已实现则应 PASS；此步确认契约）。

- [ ] **Step 3: 迁移 4 个组件**

从 `packages/mtm_market/src/remotes/{latest-news,workbench/overview,workbench/realdata,workbench}` 移植结构与文案；Antd 的 `Card/Row/Col/Statistic/Tag` 换成 `Card`/`Tag`/`DashboardGrid`；图表按需在 Task 16 引入。

- [ ] **Step 4: 组装首页并验证**

`app/(admin)/page.tsx` 为 RSC，渲染 `DashboardGrid` 与 4 个 client 组件。

Run: `bun run typecheck && bun run build`
Expected: 构建成功；带会话访问 `/` 能看到 4 个区块。

- [ ] **Step 5: 提交**

```bash
git add app/'(admin)'/page.tsx components/dashboard components/market tests/lib/services/analysis.test.ts
git commit -m "feat(home): 迁移首页仪表盘第一批组件"
```

---

### Task 16: 首页仪表盘（第二批组件）

**Files:**

- Create: `components/market/remotes/MerchantGrowth/index.tsx`
- Create: `components/market/remotes/ProductManage/index.tsx`
- Create: `components/market/remotes/FundManage/index.tsx`
- Create: `components/market/remotes/GoldMerchant/index.tsx`
- Create: `components/market/remotes/MarketActivity/index.tsx`
- Create: `components/market/remotes/Violations/index.tsx`
- Create: `components/market/remotes/TrendingChart/index.tsx`
- Modify: `components/dashboard/DashboardGrid/index.tsx`
- Modify: `package.json`（recharts）

**Interfaces:**

- 7 个 remote 组件 props 同 Task 15；`market-activity` 额外支持 `max?: number`。
- `trending-chart` 用 Recharts `LineChart`，数据来自 `/api/analysis/trending`。

- [ ] **Step 1: 安装图表依赖**

```bash
bun add recharts
```

- [ ] **Step 2: 迁移 7 个组件**

从 `packages/mtm_market/src/remotes/*` 移植；Antd `Card/Badge/Progress/List/Table` 换成 Task 12 组件；`@ant-design/charts` 的 `Line` 换成 `recharts` 的 `LineChart`。

- [ ] **Step 3: 更新首页布局**

按旧 `src/pages/home/index.tsx` 的 24 栅格顺序排布 9 个区块。

- [ ] **Step 4: 验证**

Run: `bun run typecheck && bun run build`
Expected: 构建成功；带会话访问 `/` 能看到全部 9 个区块且无 hydration 报错。

- [ ] **Step 5: 提交**

```bash
git add components/market components/dashboard package.json bun.lock
git commit -m "feat(home): 迁移首页仪表盘第二批组件"
```

---

### Task 17: 设置页、店铺管理与商标页

**Files:**

- Create: `app/(admin)/setting/page.tsx`
- Create: `app/(admin)/shop/admin/page.tsx`
- Create: `app/(admin)/shop/trademark/page.tsx`
- Create: `components/setting/ProfileForm/index.tsx`
- Create: `components/shop/admin/*`（目录与文件按 PascalCase 约定）
- Create: `components/shop/trademark/*`（目录与文件按 PascalCase 约定）

**Interfaces:**

- 页面从 `src/pages/setting`、`src/pages/shop/admin`、`src/pages/shop/trademark` 移植；表单改用 `Form` + Zod。
- 商标页的按钮标签/表格逻辑保持不变。

- [ ] **Step 1: 迁移设置页**

设置页默认展示 profile 表单；数据来自 `/api/account` 与 `/api/merchant/detail`。

- [ ] **Step 2: 迁移店铺管理页**

移植 `src/pages/shop/admin` 的列表/操作与 `components/*`。

- [ ] **Step 3: 迁移商标页**

移植 `src/pages/shop/trademark` 与 `button-tab`。

- [ ] **Step 4: 验证**

Run: `bun run typecheck && bun run build`
Expected: 三个路由（`/setting`、`/shop/admin`、`/shop/trademark`）带会话可访问，无控制台错误。

- [ ] **Step 5: 提交**

```bash
git add app/'(admin)' components/setting components/shop
git commit -m "feat(shop): 迁移设置、店铺管理与商标页面"
```

---

### Task 18: 店铺资料（5 个子页）

**Files:**

- Create: `app/(admin)/shop/profile/layout.tsx`
- Create: `app/(admin)/shop/profile/page.tsx`
- Create: `app/(admin)/shop/profile/principal/page.tsx`
- Create: `app/(admin)/shop/profile/license/page.tsx`
- Create: `app/(admin)/shop/profile/wallet/page.tsx`
- Create: `app/(admin)/shop/profile/settlement/page.tsx`
- Create: `components/shop/profile/*`（目录与文件按 PascalCase 约定）
- Modify: `package.json`（qrcode.react）

**Interfaces:**

- `ProfileLayout` 渲染二级 Tab（基本信息/负责人/资质/钱包/结算），当前路由高亮。
- 钱包页保留 `qrcode.react` 二维码与 `wallet-auth`/`wallet-card` 组件行为。

- [ ] **Step 1: 安装二维码依赖**

```bash
bun add qrcode.react
```

- [ ] **Step 2: 迁移布局与子页**

从 `src/pages/shop/profile/*` 移植；`Descriptions` 用 `LabelValue`，`Form` 用 Task 11 组件，`Modal` 用 `Dialog`。

- [ ] **Step 3: 验证**

Run: `bun run typecheck && bun run build`
Expected: 5 个路由均可访问，Tab 切换正确。

- [ ] **Step 4: 提交**

```bash
git add app/'(admin)'/shop/profile components/shop/profile package.json bun.lock
git commit -m "feat(shop): 迁移店铺资料子页面"
```

---

### Task 19: 入驻页面（第一批）

**Files:**

- Create: `app/(entry)/layout.tsx`
- Create: `app/(entry)/settleinpc/page.tsx`
- Create: `app/(entry)/settleinjx/home/page.tsx`
- Create: `app/(entry)/settleinjx/shop/page.tsx`
- Create: `components/entry/*`（目录与文件按 PascalCase 约定）

**Interfaces:**

- 入驻页为公开页面，不套管理端外壳；保留旧的步骤/表单结构。
- 页面数据来自 `/api/merchant/entry`、`/api/merchant/entry/task`、`/api/merchant/entry/type`、`/api/merchant/options`。

- [ ] **Step 1: 迁移 `settleinpc`**

从 `src/pages/settleinpc` 移植入口页。

- [ ] **Step 2: 迁移 `settleinjx/home` 与 `shop`**

从 `src/pages/settleinjx/home`、`src/pages/settleinjx/shop` 移植；图片资源复制到 `public/assets/`。

- [ ] **Step 3: 验证**

Run: `bun run typecheck && bun run build`
Expected: 三个公开路由可访问。

- [ ] **Step 4: 提交**

```bash
git add app/'(entry)' components/entry public/assets
git commit -m "feat(entry): 迁移入驻页面第一批"
```

---

### Task 20: 入驻页面（第二批）与 OCR/签约

**Files:**

- Create: `app/(entry)/settleinjx/company/page.tsx`
- Create: `components/admin/OcrUpload/index.tsx`
- Create: `components/admin/SignContract/index.tsx`
- Create: `components/admin/FieldCaptcha/index.tsx`
- Create: `components/admin/FieldIdCard/index.tsx`
- Create: `components/admin/FieldMerchantLogo/index.tsx`
- Create: `components/admin/FieldTermPicker/index.tsx`
- Create: `components/admin/FieldUploadFile/index.tsx`
- Create: `components/ui/Upload/index.tsx` + `components/ui/Upload/Upload.module.css`（原生 file input 包装，供字段组件复用）
- Modify: `components/ui/index.ts`（导出 Upload）
- Create: `app/api/venus/ocr/route.ts`
- Create: `app/api/venus/sign/route.ts`
- Create: `app/api/venus/upload/route.ts`
- Create: `lib/services/venus.ts`

**Interfaces:**

- `ocr(input: { image: string }): Promise<{ name?: string; idCard?: string }>`
- `sign(input: { contractId: string }): Promise<{ url: string }>`
- `upload(input: FormData): Promise<{ url: string }>`（演示环境返回本地占位 URL）

- [ ] **Step 1: 迁移企业信息页**

从 `src/pages/settleinjx/company` 移植。

- [ ] **Step 2: 迁移字段组件**

从 `src/components/field-*`、`ocr-upload`、`sign-contract` 移植；上传/OCR 用新的 `Upload`/`Dialog`。

- [ ] **Step 3: 实现 Venus handlers**

基于 `ReferenceData('venus-sign')` 与内存模拟返回；上传不落盘，返回 `data:` 或占位 URL，保持演示行为。

- [ ] **Step 4: 验证**

Run: `bun run typecheck && bun run build`
预期：`/settleinjx/company` 可访问；OCR/上传/签约交互可完成。

- [ ] **Step 5: 提交**

```bash
git add app/'(entry)' components/admin app/api/venus lib/services/venus.ts
git commit -m "feat(entry): 迁输入驻企业信息与 OCR 签约"
```

---

### Task 21: Market 优惠券页面

**Files:**

- Create: `app/(admin)/market/layout.tsx`
- Create: `app/(admin)/market/page.tsx`（重定向 `/market/home`）
- Create: `app/(admin)/market/home/page.tsx`
- Create: `app/(admin)/market/coupons/page.tsx`
- Create: `app/(admin)/market/coupon/create/page.tsx`
- Create: `app/(admin)/market/coupon/[id]/page.tsx`
- Create: `app/(admin)/market/coupon/update/[id]/page.tsx`
- Create: `components/market/coupon/CouponForm/index.tsx`
- Create: `components/market/coupon/CreateCouponEntry/index.tsx`
- Modify: `lib/validation/coupon.ts`（Task 10 已创建 `couponListQuerySchema` / `couponUpsertSchema`；此处复用并补充 `couponFormSchema`，不要新建重复 schema）
- Create: `tests/lib/validation/coupon.test.ts`

**Interfaces:**

- `couponFormSchema`：必填 `name/displayName/type/target/rule/stock/limit/putTerm/putCrowd/useTerm/useCrowd/position`；`stock >= 1`、`limit >= 1`、`putTerm[0] < putTerm[1]`。
- 列表页使用 `DataTable` + `useQuery(queryKeys.coupons(params))`；CRUD 后 `invalidateQueries`。
- 详情/编辑页由 RSC 预取 `getCoupon(id)`，表单用 client 包装。

- [ ] **Step 1: 写失败的测试**

`tests/lib/validation/coupon.test.ts`：

```ts
import { expect, test } from 'vitest';

import { couponFormSchema } from '@/lib/validation/coupon';

const valid = {
  name: '测试券',
  displayName: '测试展示',
  type: 0,
  target: 1,
  rule: [100, 10],
  stock: 10,
  limit: 1,
  putTerm: [1, 2],
  putCrowd: 1,
  useTerm: [3, [1, 2]],
  useCrowd: 1,
  position: 0,
};

test('rejects zero stock and inverted terms', () => {
  expect(couponFormSchema.safeParse(valid).success).toBe(true);
  expect(couponFormSchema.safeParse({ ...valid, stock: 0 }).success).toBe(false);
  expect(couponFormSchema.safeParse({ ...valid, putTerm: [2, 1] }).success).toBe(false);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run tests/lib/validation/coupon.test.ts`
Expected: FAIL。

- [ ] **Step 3: 迁移列表/详情/创建/编辑页**

从 `packages/mtm_market/src/pages/coupon/**` 移植；Antd `Table/Form/DatePicker/Radio` 换成对应新组件；状态用 `Tag` + 颜色映射；下线操作用 `Dialog` 确认后调 `DELETE /api/merchant/coupon/[id]`。

- [ ] **Step 4: 全流程验证**

```bash
bun run dev
```

用会话 Cookie 打开 `/market/coupons`：创建 → 列表出现 → 查看详情 → 编辑 → 下线 → 状态变为“已下线”；刷新后仍保留。

- [ ] **Step 5: 运行测试与构建并提交**

```bash
bunx vitest run tests/lib/validation/coupon.test.ts && bun run typecheck && bun run build
git add app/'(admin)'/market components/market lib/validation/coupon.ts tests/lib/validation
git commit -m "feat(market): 迁移优惠券列表与增删改查"
```

---

### Task 22: Market 首页

**Files:**

- Create: `components/market/home/*`（目录与文件按 PascalCase 约定）
- Modify: `app/(admin)/market/home/page.tsx`

**Interfaces:**

- 从 `packages/mtm_market/src/pages/home` 移植页面区块；导航链接改为 `/market/...` 真实路径。

- [ ] **Step 1: 迁移 Market 首页**

复制区块结构与文案；Antd 组件替换为 Task 11/12 组件。

- [ ] **Step 2: 验证**

Run: `bun run typecheck && bun run build`
Expected: `/market` 与 `/market/home` 均可访问。

- [ ] **Step 3: 提交**

```bash
git add app/'(admin)'/market components/market/home
git commit -m "feat(market): 迁移市场首页"
```

---

### Task 23: 删除旧工程与依赖

**Files:**

- Delete: `src/`
- Delete: `packages/`
- Delete: `webpack.config.js`
- Delete: `postcss.config.js`
- Delete: `hosts/`
- Delete: `dist/`
- Delete: `.github/workflows/mtm.yml`
- Delete: `.github/workflows/mtm_market.yml`
- Delete: `public/api/`（种子已复制到 `lib/db/seed/data`）
- Modify: `package.json`
- Modify: `.oxlintrc.jsonc`, `.oxfmtrc.jsonc`
- Modify: `tsconfig.json`
- Modify: `README.asciidoc`（命令与结构说明）

**Interfaces:**

- 最终 scripts：`dev/build/start/test/test:watch/lint/lint:fix/typecheck/fmt/fmt:check/prepare`。
- 最终依赖：`next, react, react-dom, sequelize, sqlite3, next-auth, @tanstack/react-query, @tanstack/react-table, zustand, react-hook-form, @hookform/resolvers, zod, @base-ui-components/react, lucide-react, recharts, qrcode.react, dayjs, numeral, lodash, classnames, jose`。

- [ ] **Step 1: 删除旧目录与配置**

```bash
# dist/ 当前未纳入版本控制，git rm 会失败；先删目录，其余已跟踪路径用 git rm
rm -rf dist
git rm -r src packages webpack.config.js postcss.config.js hosts public/api
git rm .github/workflows/mtm.yml .github/workflows/mtm_market.yml
```

- [ ] **Step 2: 更新 package.json**

删除 `analyzer` 脚本与不再使用的依赖（`antd`、`@ant-design/*`、`@ant-design/pro-components`、`qiankun`、`react-router-dom`、`redux*`、`@reduxjs/toolkit`、`axios`、`history`、`js-cookie`、webpack/loader/plugin 系列、`esbuild-loader`、`sass`、`less` 等）。保留 husky/commitlint/lint-staged/oxlint/oxfmt/vitest/测试库，以及仍被代码引用的 `@types/node`、`@types/react`、`@types/react-dom`、`@types/lodash`、`@types/numeral`。

```bash
bun install
```

- [ ] **Step 3: 清理 lint/格式/TS 配置**

移除 `ignorePatterns` 中的 `src`、`packages`；`tsconfig.exclude` 只保留 `node_modules`、`.next`、`dist`；确认 `@/*` 指向仓库根。

- [ ] **Step 4: 验证依赖已彻底移除**

```bash
grep -R "antd\|@ant-design\|qiankun\|react-router-dom\|@reduxjs/toolkit\|react-redux\|redux-thunk\|\baxios\b\|window.mtm\|__POWERED_BY_QIANKUN__" --include='*.ts' --include='*.tsx' --include='package.json' . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=docs
```

Expected: 无输出。

- [ ] **Step 5: 全量校验**

```bash
bun run lint && bun run typecheck && bun run test && bun run build
```

Expected: 全部通过；构建产物无旧工程文件。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "chore: 移除微前端与旧 webpack 工程"
```

---

### Task 24: Docker 与 CI

**Files:**

- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `docker-compose.yml`
- Create: `.github/workflows/deploy.yml`
- Modify: `README.asciidoc`
- Modify: `.env.example`

**Interfaces:**

- 镜像：多阶段（bun 安装/构建 → Node 22 slim 运行），`NEXT_TELEMETRY_DISABLED=1`、非 root 用户、`/data` 预创建可写。
- 运行时 env：`DATABASE_PATH=/data/mtm.sqlite`、`AUTH_SECRET`、`PORT=3000`。
- Compose：单服务 + named volume `mtm-data:/data`。
- CI：lint/typecheck/test/build → docker build → push GHCR → SSH `docker compose pull && up -d`。

- [ ] **Step 1: 编写 Dockerfile 与 .dockerignore**

多阶段要点：builder 用 `oven/bun:1` 执行 `bun install --frozen-lockfile` 与 `bun run build`；runner 用 `node:22-slim`，只复制 `.next/standalone`、`.next/static`、`public`；`RUN mkdir -p /data && chown nextjs:nodejs /data`；`USER nextjs`；`CMD ["node", "server.js"]`。`sequelize`/`sqlite3` 在 `serverExternalPackages` 中，standalone 追踪可能漏掉原生 `.node` 二进制；构建后在 runner 里显式保留 `node_modules/sqlite3`（以及 `.next/standalone/node_modules/sqlite3` 若存在），健康检查步骤会验证。

`.dockerignore` 排除 `node_modules`、`.next`、`data`、`.git`、`docs`。

- [ ] **Step 2: 编写 compose 与 CI**

`docker-compose.yml` 按设计文档 13.2；`deploy.yml` 使用 `docker/login-action`、`docker/build-push-action`、`appleboy/ssh-action`，并保留现有仓库 secrets（`HOST/USERNAME/KEY/PORT/TARGET`）。

- [ ] **Step 3: 本地构建与健康检查**

```bash
docker build -t mtm:test .
docker run --rm -d --name mtm-test -p 3000:3000 -v mtm-data:/data -e AUTH_SECRET=test-secret mtm:test
sleep 3
curl -s http://localhost:3000/api/health
docker rm -f mtm-test
```

Expected: `{"code":0,"message":"ok","data":{"db":true}}`。

- [ ] **Step 4: 验证种子幂等**

```bash
docker run --rm -v mtm-data:/data -e AUTH_SECRET=test-secret mtm:test node -e "console.log('volume ok')"
```

再用同一 volume 启动两次，健康检查均通过，日志无重复插入错误。

- [ ] **Step 5: 提交**

```bash
git add Dockerfile .dockerignore docker-compose.yml .github/workflows/deploy.yml README.asciidoc .env.example
git commit -m "chore(deploy): 添加 Docker 部署与 CI"
```

---

### Task 25: 回归与收尾

**Files:**

- Create: `scripts/smoke.ts`
- Create: `docs/superpowers/plans/2026-11-03-regression-results.md`（仅记录本次执行结果；不含长期文档）
- Modify: `package.json`（增加 `"smoke": "bun scripts/smoke.ts"`）

**Interfaces:**

- `scripts/smoke.ts`：
  1. 设 `DATABASE_PATH=./data/smoke.sqlite`，启动前删除旧文件。
  2. 生成会话 Cookie（复用 `scripts/session-cookie.ts`）。
  3. 请求公开路由：`/login`、`/register`、`/register/success`、`/settleinpc`、`/settleinjx/home`、`/settleinjx/shop`、`/settleinjx/company` → 200。
  4. 未带 Cookie 请求 `/`、`/market/coupons` → 307/302 到 `/login`。
  5. 带 Cookie 请求全部受保护路由 → 200。
  6. 调 `POST /api/merchant/coupon` 创建券 → `GET /api/merchant/coupon` 能查到 → `DELETE /api/merchant/coupon/[id]` 返回 `status = 6`。
  7. 输出每个路由的 status 与断言结果；任一失败以非 0 退出。

- [ ] **Step 1: 编写 smoke 脚本**

使用 Node 原生 `fetch`；Cookie 从 `scripts/session-cookie.ts` 导入 `createSessionCookie`（不要依赖它的直接执行输出）。启动前确保 `data/` 目录存在（`mkdir -p data`），再删除旧的 `data/smoke.sqlite`。路由清单与设计文档第 6 节一致。

- [ ] **Step 2: 启动生产构建并运行 smoke**

```bash
bun run build
DATABASE_PATH=./data/smoke.sqlite AUTH_SECRET=test-secret bun run start &
sleep 5
bun run smoke
```

Expected: 所有路由断言通过；优惠券创建/下线流程通过；脚本退出码 0。

- [ ] **Step 3: 全量校验**

```bash
bun run lint && bun run typecheck && bun run test && bun run build
```

Expected: 全部通过。

- [ ] **Step 4: 记录结果**

把 smoke 输出与手工检查项写入 `docs/superpowers/plans/2026-11-03-regression-results.md`，包括：

- 登录（86/65/852/853）。
- 首页 9 个仪表盘区块。
- `/setting`、`/shop/admin`、`/shop/trademark`、`/shop/profile/*`。
- 入驻 4 个页面。
- `/market/*` 优惠券全流程。
- 容器重启后数据保留。
- 控制台无 hydration 错误。

- [ ] **Step 5: 提交**

```bash
git add scripts/smoke.ts package.json docs/superpowers/plans/2026-11-03-regression-results.md
git commit -m "test: 添加迁移回归 smoke 与结果记录"
```

---

## Self-Review

**1. Spec coverage**

| Spec 要求                                        | 任务               |
| ------------------------------------------------ | ------------------ |
| 单 Next App Router 应用                          | 1, 13, 23          |
| 移除 qiankun/Module Federation/window.mtm/shared | 23                 |
| 移除 Antd/ProComponents/icons/charts             | 11, 12, 16, 23     |
| Base UI + CSS Modules + tokens                   | 2, 11, 12          |
| Sequelize + SQLite + 种子                        | 3, 4, 6            |
| 优惠券软删除/两套 DTO                            | 6, 7, 10, 21       |
| NextAuth Credentials + JWT + interCode           | 8, 14              |
| 验证码                                           | 8, 14              |
| RSC → service；Route Handlers 给客户端           | 5, 7, 9, 10, 13–22 |
| TanStack Query/Zustand/RHF+Zod/Table             | 2, 11, 12, 13, 21  |
| 路由映射（含 market/入驻/设置/店铺）             | 14–22              |
| 菜单收藏上限 10 / 死链落 404                     | 4, 5, 13           |
| Docker + volume                                  | 24                 |
| CI 替换 scp                                      | 24                 |
| 验收标准（lint/typecheck/build/依赖清理）        | 23, 25             |

**2. Step scan**

每个实现步骤都给出了文件、签名或具体数据决策；UI 迁移步骤指向旧文件作为行为基准，避免把整段 JSX 抄进计划。没有 “TBD/处理边界情况” 之类无决策步骤。

**3. Type consistency**

- 分页统一 `PaginationInput/Pagination`（Task 1），服务与 handler 复用。
- 菜单 DTO 统一 `MenuItemDTO`（Task 5），收藏工具（Task 13）复用。
- 优惠券统一 `CouponListItemDTO/CouponDetailDTO`（Task 7），列表/详情页（Task 21）与 handler（Task 10）复用。
- 认证会话字段统一 `accountId/mobile/interCode/merchantId/login`（Task 8），外壳（Task 13）与页面复用。
- API 响应统一 `ok/fail`（Task 5），所有 handler 复用。

**4. Review Focus**

五条风险都已在对应任务中安排测试或验证：

- 区号登录 → Task 14 `schema.test.ts`。
- 优惠券详情孤链 → Task 7。
- 下线/过滤/总数 → Task 7、Task 10。
- 收藏重复/上限 → Task 5、Task 13。
- 种子幂等/volume → Task 4、Task 24、Task 25。

**5. Proportion**

计划包含签名、关键测试与数据决策；页面迁移以“从旧文件移植 + 组件替换”描述，没有复制大段实现代码。计划长度与 171 个 TS/TSX、78 个 Antd 引用、25 个任务的迁移规模相称。
