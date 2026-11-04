# Phase 2: 认证、权限与 ops-admin 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让两个门户各自拥有密码登录、基于权限码的菜单过滤与页面/接口校验，并新增带账号/角色管理的运营端 `apps/ops-admin`；同时把门户到 `core-api` 的短期签名 JWT 通道打通。

**Architecture:** 权限码集中在 `packages/contracts`；密码哈希、服务间签名、菜单过滤、登录限流放进 `packages/auth`；共享 UI 以“复制到 `packages/ui`、商家端暂留原路径”的方式供新运营端使用。`apps/ops-admin` 新建并拥有 `commerce_ops`；`apps/merchant-admin` 保留现有手机号+验证码登录，新增主账号/子账号密码登录与子账号/角色管理。两个门户的会话由各自 Auth.js 实例管理，服务端用数据库实时计算权限，再以 60 秒 HS256 JWT 调用 `core-api`。

**Tech Stack:** Bun 1.4.4 workspaces、Turborepo、Next.js 15 + React 19、Auth.js v5、Prisma 6 + PostgreSQL 17、Hono、`jose`、`@node-rs/argon2`、Vitest、oxlint/oxfmt。

**Spec:** `docs/superpowers/specs/2026-11-03-open-commerce-admin-design.md`

**本阶段范围边界：**

- 只做认证、权限、菜单、运营账号/角色管理，以及商家端主账号/子账号与角色管理。
- 商品、类目、品牌、审核、商家/店铺主数据的功能页面只放占位页，留给阶段 3/4。
- 不做 i18n、Docker 镜像、SSH 部署、E2E 和品牌脱敏（阶段 5）。
- 旧运营端 `fe-shop-admin` 的 SSO/UAC/IAM、`indexOf` 路由匹配不照搬。

## Global Constraints

- 包管理器固定 `bun@1.4.4`；workspaces 为 `apps/*`、`packages/*`；新包作用域 `@mtm/*`；提交前更新 `bun.lock`。
- 端口：`merchant-admin` 3000、`ops-admin` 3001、`core-api` 4000。
- 三个库：`commerce_core`、`commerce_ops`、`commerce_merchant`；跨库只存 ID，不做外键。
- 权限码一律精确匹配（`Set.has`），任何位置都不得使用 `indexOf`/子串判断路由或权限。
- `merchantId` 只从服务端会话读取；运营端商家范围只从数据库计算，再写入服务间 JWT，不接受请求参数覆盖。
- 运营端、商家端会话 Cookie 名分别为 `ops.session`、`merchant.session`；生产环境加 `__Secure-` 前缀。
- 会话有效期 2 小时（JWT 策略）；服务间 JWT 为 HS256、有效期 60 秒、`iss=mtm-ports`、`aud=mtm-core-api`。
- 密钥：商家端沿用 `AUTH_SECRET`，运营端使用 `OPS_AUTH_SECRET`，服务间使用 `CORE_API_JWT_SECRET`；三者不得写死默认值，生产环境拒绝 `change-me`。
- 密码哈希固定 Argon2id，参数 `memoryCost=19456`、`timeCost=2`、`parallelism=1`。
- 登录限流：同一账号/标识 15 分钟内连续失败 5 次即拒绝，成功登录后清零；内存实现，重启即清空。
- 演示账号只由种子创建：运营端 `admin / admin123`；商家主账号 `merchant@example.com / merchant123`（手机号 `13412345678` 仍可验证码登录）；商家子账号 `staff@example.com / staff123`。
- `apps/ops-admin` 的页面与业务组件只从 `@mtm/ui` 导入 UI；`antd` 只出现在 `app/layout.tsx`、`app/providers.tsx` 和 `packages/ui` 内部。商家端页面继续从 `@/components/ui` 导入。
- 所有种子写入必须幂等（`upsert`/`skipDuplicates` + `SeedMeta` 版本门），重复执行不得产生重复行或重置密码。
- 测试数据库连接串必须包含 `_test`；全局 setup 在重置前校验，否则直接失败。
- 本阶段不删除任何演示业务数据；商家端现有店铺/营销/优惠券行为保持不变。

## Review Focus

| #   | 输入 / 条件                                                        | 期望行为                                                                                                    | 由哪个任务的测试固定                           |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | 子账号 `staff@example.com` 登录商家端                              | 菜单不出现“账号管理/角色管理”；直接访问 `/system/accounts` 被重定向到 `/403`；调用 `/api/accounts` 返回 403 | Task 14（菜单+页面守卫）、Task 15（接口）      |
| 2   | 运营账号没有 `platform:cross-tenant`，只被授权商家 A               | 登录后菜单正常，但 BFF 签出的 JWT 中 `merchantScope=["A"]`；`core-api` 只接受 A，越权返回 403               | Task 9（范围计算）、Task 17（JWT 与 core-api） |
| 3   | 不存在的用户名、错误密码、已禁用账号、连续 5 次失败                | 全部返回同一种登录失败，不泄露账号是否存在；已存在账号写入失败登录日志；第 6 次即使密码正确也被限流拒绝     | Task 8（运营端）、Task 13（商家端）            |
| 4   | 会话有效期间管理员撤掉了某角色的 `account:manage`                  | 下一次请求按数据库实时权限判断：菜单刷新后消失，页面跳 403，接口返回 403；不依赖 JWT 里的旧权限             | Task 9、Task 14                                |
| 5   | 服务间 JWT 过期、被篡改、用错密钥，或 `CORE_API_JWT_SECRET` 未配置 | 过期/篡改/错密钥返回 401；未配置密钥返回 500 且不返回任何业务数据                                           | Task 3（签发/校验）、Task 17（中间件）         |

---

### Task 1: `packages/contracts` 共享权限码

**Files:**

- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/vitest.config.ts`
- Create: `packages/contracts/src/permissions.ts`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/contracts/tests/permissions.test.ts`

**Interfaces:**

- Consumes: 无。
- Produces:
  - `PERMISSIONS`（`as const`，键名与设计文档 7.1 一致）。
  - `type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]`
  - `ALL_PERMISSIONS: readonly PermissionCode[]`
  - `OPS_PERMISSIONS: readonly PermissionCode[]`
  - `MERCHANT_PERMISSIONS: readonly PermissionCode[]`
  - `isOpsPermission(code: string): boolean`
  - `isMerchantPermission(code: string): boolean`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, test } from 'vitest';

import {
  ALL_PERMISSIONS,
  MERCHANT_PERMISSIONS,
  OPS_PERMISSIONS,
  PERMISSIONS,
  isMerchantPermission,
  isOpsPermission,
} from '../src/permissions';

describe('permission catalogue', () => {
  test('codes are unique', () => {
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
  });

  test('ops never gets merchant write codes', () => {
    expect(OPS_PERMISSIONS).not.toContain(PERMISSIONS.PRODUCT_CREATE);
    expect(OPS_PERMISSIONS).not.toContain(PERMISSIONS.PRODUCT_UPDATE);
    expect(OPS_PERMISSIONS).not.toContain(PERMISSIONS.PRODUCT_DELETE);
    expect(OPS_PERMISSIONS).not.toContain(PERMISSIONS.PRODUCT_SUBMIT);
    expect(OPS_PERMISSIONS).not.toContain(PERMISSIONS.PRODUCT_PUBLISH);
    expect(OPS_PERMISSIONS).toContain(PERMISSIONS.PRODUCT_AUDIT);
    expect(OPS_PERMISSIONS).toContain(PERMISSIONS.PLATFORM_CROSS_TENANT);
  });

  test('merchant never gets audit or category/brand management', () => {
    expect(MERCHANT_PERMISSIONS).not.toContain(PERMISSIONS.PRODUCT_AUDIT);
    expect(MERCHANT_PERMISSIONS).not.toContain(PERMISSIONS.CATEGORY_MANAGE);
    expect(MERCHANT_PERMISSIONS).not.toContain(PERMISSIONS.BRAND_MANAGE);
    expect(MERCHANT_PERMISSIONS).toContain(PERMISSIONS.PRODUCT_PUBLISH);
  });

  test('guards reject unknown codes', () => {
    expect(isOpsPermission('product:audit')).toBe(true);
    expect(isOpsPermission('product:create')).toBe(false);
    expect(isMerchantPermission('account:manage')).toBe(true);
    expect(isMerchantPermission('product:audit')).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run --cwd packages/contracts test`
Expected: FAIL，模块或导出不存在。

- [ ] **Step 3: 创建包与实现**

`package.json`：`name` 为 `@mtm/contracts`，`private: true`，`type: "module"`，`exports` 同时暴露 `"."` → `./src/index.ts` 与 `"./permissions"` → `./src/permissions.ts`；脚本 `lint`/`format`/`format:fix`/`typecheck`/`test` 与其它包同构（`oxlint -c ../../packages/config/oxlint.jsonc`、`oxfmt --check --config ../../packages/config/oxfmt.jsonc`、`tsc --noEmit`、`vitest run`）。

`src/permissions.ts` 按设计文档 7.1 原样定义 17 个码，并导出：

```ts
export const OPS_PERMISSIONS = [
  PERMISSIONS.PRODUCT_VIEW,
  PERMISSIONS.PRODUCT_AUDIT,
  PERMISSIONS.CATEGORY_VIEW,
  PERMISSIONS.CATEGORY_MANAGE,
  PERMISSIONS.BRAND_MANAGE,
  PERMISSIONS.MERCHANT_VIEW,
  PERMISSIONS.SHOP_VIEW,
  PERMISSIONS.ACCOUNT_MANAGE,
  PERMISSIONS.ROLE_MANAGE,
  PERMISSIONS.PLATFORM_CROSS_TENANT,
] as const satisfies readonly PermissionCode[];

export const MERCHANT_PERMISSIONS = [
  PERMISSIONS.PRODUCT_VIEW,
  PERMISSIONS.PRODUCT_CREATE,
  PERMISSIONS.PRODUCT_UPDATE,
  PERMISSIONS.PRODUCT_DELETE,
  PERMISSIONS.PRODUCT_SUBMIT,
  PERMISSIONS.PRODUCT_PUBLISH,
  PERMISSIONS.MERCHANT_UPDATE,
  PERMISSIONS.SHOP_UPDATE,
  PERMISSIONS.ACCOUNT_MANAGE,
  PERMISSIONS.ROLE_MANAGE,
] as const satisfies readonly PermissionCode[];

export function isOpsPermission(code: string): boolean {
  return (OPS_PERMISSIONS as readonly string[]).includes(code);
}
```

`isMerchantPermission` 同理；`src/index.ts` 重导出 `./permissions`。

`vitest.config.ts`：`environment: 'node'`，`include: ['tests/**/*.test.ts']`。

- [ ] **Step 4: 安装并验证**

```bash
bun install
bun run --cwd packages/contracts test
bun run --cwd packages/contracts typecheck
bun run --cwd packages/contracts lint
```

Expected: 全部通过。

- [ ] **Step 5: 提交**

```bash
git add packages/contracts bun.lock
git commit -m "feat(contracts): share permission codes across portals"
```

---

### Task 2: `packages/auth` 密码哈希与登录限流

**Files:**

- Create: `packages/auth/package.json`
- Create: `packages/auth/tsconfig.json`
- Create: `packages/auth/vitest.config.ts`
- Create: `packages/auth/src/password.ts`
- Create: `packages/auth/src/rate-limit.ts`
- Create: `packages/auth/tests/password.test.ts`
- Create: `packages/auth/tests/rate-limit.test.ts`

**Interfaces:**

- Consumes: 无。
- Produces:
  - `hashPassword(password: string): Promise<string>`
  - `verifyPassword(hashValue: string, password: string): Promise<boolean>`
  - `createLoginRateLimiter(options?: { maxFailures?: number; windowMs?: number; now?: () => number }): LoginRateLimiter`
  - `LoginRateLimiter`：`isBlocked(key: string): boolean`、`recordFailure(key: string): void`、`reset(key: string): void`、`clear(): void`

- [ ] **Step 1: 写失败测试**

```ts
// packages/auth/tests/password.test.ts
import { describe, expect, test } from 'vitest';

import { hashPassword, verifyPassword } from '../src/password';

test('hashes with argon2id and verifies', async () => {
  const hash = await hashPassword('merchant123');
  expect(hash.startsWith('$argon2id$')).toBe(true);
  await expect(verifyPassword(hash, 'merchant123')).resolves.toBe(true);
  await expect(verifyPassword(hash, 'wrong')).resolves.toBe(false);
});

test('each hash uses a distinct salt', async () => {
  const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')]);
  expect(a).not.toBe(b);
});

test('malformed hashes verify false instead of throwing', async () => {
  await expect(verifyPassword('not-a-hash', 'x')).resolves.toBe(false);
});
```

```ts
// packages/auth/tests/rate-limit.test.ts
import { describe, expect, test } from 'vitest';

import { createLoginRateLimiter } from '../src/rate-limit';

test('blocks on the fifth failure within the window', () => {
  const limiter = createLoginRateLimiter({ maxFailures: 5, windowMs: 1000, now: () => 0 });
  for (let i = 0; i < 4; i += 1) limiter.recordFailure('a');
  expect(limiter.isBlocked('a')).toBe(false);
  limiter.recordFailure('a');
  expect(limiter.isBlocked('a')).toBe(true);
  expect(limiter.isBlocked('b')).toBe(false);
});

test('expires failures after the window and resets on success', () => {
  let now = 0;
  const limiter = createLoginRateLimiter({ maxFailures: 2, windowMs: 1000, now: () => now });
  limiter.recordFailure('a');
  limiter.recordFailure('a');
  expect(limiter.isBlocked('a')).toBe(true);
  now = 1001;
  expect(limiter.isBlocked('a')).toBe(false);
  limiter.recordFailure('a');
  limiter.reset('a');
  limiter.recordFailure('a');
  expect(limiter.isBlocked('a')).toBe(false);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run --cwd packages/auth test`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 创建包与实现**

`package.json`：`name` 为 `@mtm/auth`，`type: "module"`，`exports` 暴露 `"./password"`、`"./rate-limit"`（Task 3 再追加 `"./service-token"`、`"./menu-filter"`）；依赖 `@node-rs/argon2`（与仓库其它依赖同样使用 `^` 语义的最新版）；devDependencies 含 `@mtm/config`、`typescript`、`vitest`。不要提供根导出，避免 `core-api` 无意加载原生密码库。

`password.ts` 使用 `Algorithm.Argon2id`、`memoryCost: 19456`、`timeCost: 2`、`parallelism: 1`；`verifyPassword` 用 `try/catch` 包裹 `verify`，异常返回 `false`。

`rate-limit.ts`：`Map<string, number[]>` 保存失败时间戳；每次访问先剔除窗口外记录；`recordFailure` 追加；`isBlocked` 判断长度 `>= maxFailures`；默认 `5` 次 / `15 * 60_000` 毫秒。

- [ ] **Step 4: 验证**

```bash
bun install
bun run --cwd packages/auth test
bun run --cwd packages/auth typecheck
bun run --cwd packages/auth lint
```

- [ ] **Step 5: 提交**

```bash
git add packages/auth bun.lock
git commit -m "feat(auth): add argon2 hashing and login rate limiting"
```

---

### Task 3: `packages/auth` 服务间 JWT 与菜单过滤

**Files:**

- Modify: `packages/auth/package.json`（追加导出）
- Create: `packages/auth/src/service-token.ts`
- Create: `packages/auth/src/menu-filter.ts`
- Create: `packages/auth/tests/service-token.test.ts`
- Create: `packages/auth/tests/menu-filter.test.ts`

**Interfaces:**

- Consumes: 无（`jose` 直接依赖）。
- Produces:
  - `type Portal = 'ops' | 'merchant'`
  - `interface ServiceTokenClaims { portal: Portal; userId: string; merchantId: string | null; permissions: string[]; merchantScope: string[] | null }`
  - 常量 `SERVICE_TOKEN_ISSUER = 'mtm-ports'`、`SERVICE_TOKEN_AUDIENCE = 'mtm-core-api'`、`SERVICE_TOKEN_TTL_SECONDS = 60`
  - `signServiceToken(claims: ServiceTokenClaims, secret: string): Promise<string>`
  - `verifyServiceToken(token: string, secret: string): Promise<ServiceTokenClaims>`
  - `interface PermissionMenuNode { id: string; parentId: string; url?: string | null; permissionCode?: string | null; children?: PermissionMenuNode[] }`
  - `canAccessMenu(node, permissions: ReadonlySet<string>): boolean`
  - `filterMenuTree<T extends PermissionMenuNode>(nodes: T[], permissions: ReadonlySet<string>): T[]`

- [ ] **Step 1: 写失败测试**

```ts
// service-token.test.ts
import { afterEach, describe, expect, test, vi } from 'vitest';

import { signServiceToken, verifyServiceToken } from '../src/service-token';

const claims = {
  portal: 'ops' as const,
  userId: 'u1',
  merchantId: null,
  permissions: ['merchant:view'],
  merchantScope: ['m1'],
};

afterEach(() => vi.useRealTimers());

test('round-trips claims', async () => {
  const token = await signServiceToken(claims, 'secret');
  await expect(verifyServiceToken(token, 'secret')).resolves.toMatchObject(claims);
});

test('rejects expiry, tampering and wrong secrets', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  const token = await signServiceToken(claims, 'secret');
  vi.setSystemTime(new Date('2026-01-01T00:01:01Z'));
  await expect(verifyServiceToken(token, 'secret')).rejects.toThrow();
  vi.useRealTimers();

  const fresh = await signServiceToken(claims, 'secret');
  await expect(verifyServiceToken(`${fresh}x`, 'secret')).rejects.toThrow();
  await expect(verifyServiceToken(fresh, 'other')).rejects.toThrow();
});

test('rejects malformed claims', async () => {
  const token = await signServiceToken({ ...claims, portal: 'admin' as never }, 'secret');
  await expect(verifyServiceToken(token, 'secret')).rejects.toThrow();
});
```

```ts
// menu-filter.test.ts
import { expect, test } from 'vitest';

import { filterMenuTree } from '../src/menu-filter';

const tree = [
  {
    id: 'system',
    parentId: '-1',
    permissionCode: null,
    children: [
      { id: 'accounts', parentId: 'system', url: '/system/accounts', permissionCode: 'account:manage' },
      { id: 'roles', parentId: 'system', url: '/system/roles', permissionCode: 'role:manage' },
    ],
  },
  { id: 'home', parentId: '-1', url: '/', permissionCode: null },
];

test('keeps open items and granted leaves', () => {
  const result = filterMenuTree(tree, new Set(['role:manage']));
  expect(result.map(item => item.id)).toEqual(['system', 'home']);
  expect(result[0].children?.map(item => item.id)).toEqual(['roles']);
});

test('drops a group when no child survives', () => {
  const result = filterMenuTree(tree, new Set());
  expect(result.map(item => item.id)).toEqual(['home']);
});

test('does not mutate the input', () => {
  const before = JSON.stringify(tree);
  filterMenuTree(tree, new Set());
  expect(JSON.stringify(tree)).toBe(before);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run --cwd packages/auth test`
Expected: FAIL，新模块不存在。

- [ ] **Step 3: 实现**

`service-token.ts` 用 `jose` 的 `SignJWT`/`jwtVerify`：

```ts
const key = new TextEncoder().encode(secret);
const token = await new SignJWT({ ...claims })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuer(SERVICE_TOKEN_ISSUER)
  .setAudience(SERVICE_TOKEN_AUDIENCE)
  .setIssuedAt()
  .setExpirationTime(`${SERVICE_TOKEN_TTL_SECONDS}s`)
  .sign(key);
```

校验时固定 `algorithms: ['HS256']`、 issuer、audience，并逐字段校验 `portal`、`userId` 非空、`permissions` 为字符串数组、`merchantScope` 为 `null` 或字符串数组；不合法统一抛出 `Error('INVALID_SERVICE_TOKEN')`。

`menu-filter.ts` 递归复制节点：`selfAllowed = !permissionCode || permissions.has(permissionCode)`；自身不允许直接丢弃；原本有子节点但过滤后为空也丢弃；不修改入参。`canAccessMenu` 只判断自身。

- [ ] **Step 4: 验证并提交**

```bash
bun install
bun run --cwd packages/auth test
bun run --cwd packages/auth typecheck
git add packages/auth bun.lock
git commit -m "feat(auth): sign service tokens and filter menus by permission"
```

---

### Task 4: `packages/ui` 复制基础组件

**Files:**

- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/vitest.config.ts`
- Create: `packages/ui/tests/setup.ts`
- Create: `packages/ui/tests/exports.test.tsx`
- Copy: `apps/merchant-admin/components/ui/**` → `packages/ui/src/**`
- Create: `packages/ui/src/index.ts`（内容与商家端 `components/ui/index.ts` 相同）

**Interfaces:**

- Consumes: 无。
- Produces: 包 `@mtm/ui`，导出与 `apps/merchant-admin/components/ui/index.ts` 完全一致（Button、Input、Form、DataTable、Toast 等）。Task 5 追加布局与权限组件。

- [ ] **Step 1: 写失败测试**

```tsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { Button } from '../src';

test('package exposes the shared primitives', () => {
  render(<Button>确定</Button>);
  expect(screen.getByRole('button', { name: '确定' })).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run --cwd packages/ui test`
Expected: FAIL，包或 `src/index.ts` 不存在。

- [ ] **Step 3: 复制并建立包**

```bash
mkdir -p packages/ui/src
cp -R apps/merchant-admin/components/ui/. packages/ui/src/
```

复制后 `packages/ui/src/index.ts` 保持原导出内容；不要改组件实现，组件内部的相对导入（`../cx`、`./X.module.css`）在复制后依然成立。

`package.json`：`name` 为 `@mtm/ui`，`type: "module"`，`exports: { ".": "./src/index.ts" }`；`dependencies` 包含 `@base-ui-components/react`、`@hookform/resolvers`、`antd`、`dayjs`、`lucide-react`、`next`、`react`、`react-dom`、`react-hook-form`、`zod`；`devDependencies` 含 `@mtm/config`、`@testing-library/jest-dom`、`@testing-library/react`、`@types/react`、`@types/react-dom`、`jsdom`、`typescript`、`vitest`。脚本同其它包，`test` 为 `vitest run`。

`vitest.config.ts`：`environment: 'jsdom'`、`setupFiles: ['./tests/setup.ts']`、`oxc` JSX 配置与商家端一致。`tests/setup.ts` 复制商家端 `tests/setup.ts` 中 `matchMedia`/`ResizeObserver`/`scrollTo` 的补齐逻辑（去掉数据库相关行）。

- [ ] **Step 4: 验证**

```bash
bun install
bun run --cwd packages/ui test
bun run --cwd packages/ui typecheck
bun run --cwd packages/ui lint
```

Expected: 全部通过。

- [ ] **Step 5: 提交**

```bash
git add packages/ui bun.lock
git commit -m "feat(ui): copy shared primitives into packages/ui"
```

---

### Task 5: 共享壳层与按钮级权限组件

**Files:**

- Create: `packages/ui/src/layout/types.ts`
- Create: `packages/ui/src/layout/AdminShell.tsx`、`AdminShell.module.css`
- Create: `packages/ui/src/layout/Sidebar.tsx`、`Sidebar.module.css`
- Create: `packages/ui/src/layout/SidebarMenu.tsx`
- Create: `packages/ui/src/layout/Header.tsx`
- Create: `packages/ui/src/layout/PageContainer.tsx`（从商家端复制）
- Create: `packages/ui/src/layout/PageContainer.module.css`（复制）
- Create: `packages/ui/src/layout/Breadcrumbs.tsx`（复制并改相对导入）
- Create: `packages/ui/src/feedback/Forbidden.tsx`
- Create: `packages/ui/src/permission.tsx`
- Modify: `packages/ui/src/index.ts`
- Create: `packages/ui/tests/permission.test.tsx`
- Create: `packages/ui/tests/shell.test.tsx`

**Interfaces:**

- Consumes: `@mtm/ui` 自身基础组件。
- Produces:
  - `interface MenuNode { id: string; title: string; icon?: string; url: string; children?: MenuNode[] }`
  - `interface ShellAccount { name: string; username: string }`
  - `AdminShell({ title, menu, account, children })`
  - `PageContainer`、`Breadcrumbs`、`Forbidden`
  - `PermissionProvider({ permissions: string[]; children })`
  - `usePermissions(): ReadonlySet<string>`
  - `Can({ permission: string; children; fallback? })`
  - `PermissionButton({ permission: string; ...ButtonProps })`

- [ ] **Step 1: 写失败测试**

```tsx
// permission.test.tsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { Button } from '../src';
import { Can, PermissionButton, PermissionProvider } from '../src';

test('Can hides children without the permission', () => {
  const { rerender } = render(
    <PermissionProvider permissions={[]}>
      <Can permission='account:manage'>可见</Can>
    </PermissionProvider>
  );
  expect(screen.queryByText('可见')).not.toBeInTheDocument();

  rerender(
    <PermissionProvider permissions={['account:manage']}>
      <Can permission='account:manage'>可见</Can>
    </PermissionProvider>
  );
  expect(screen.getByText('可见')).toBeInTheDocument();
});

test('PermissionButton renders a Button only when allowed', () => {
  const { rerender } = render(
    <PermissionProvider permissions={[]}>
      <PermissionButton permission='role:manage'>新建角色</PermissionButton>
    </PermissionProvider>
  );
  expect(screen.queryByRole('button', { name: '新建角色' })).not.toBeInTheDocument();

  rerender(
    <PermissionProvider permissions={['role:manage']}>
      <PermissionButton permission='role:manage'>新建角色</PermissionButton>
    </PermissionProvider>
  );
  expect(screen.getByRole('button', { name: '新建角色' })).toBeInTheDocument();
});
```

```tsx
// shell.test.tsx
import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/system/accounts' }));
vi.mock('next-auth/react', () => ({ signOut: vi.fn() }));

import { AdminShell } from '../src';

test('renders menu, account and children', () => {
  render(
    <AdminShell
      title='运营后台'
      account={{ name: '超级管理员', username: 'admin' }}
      menu={[
        {
          id: 'system',
          title: '系统管理',
          url: '/system',
          children: [{ id: 'accounts', title: '账号管理', url: '/system/accounts' }],
        },
      ]}
    >
      <p>内容</p>
    </AdminShell>
  );
  expect(screen.getByText('运营后台')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /账号管理/ })).toBeInTheDocument();
  expect(screen.getByText('超级管理员')).toBeInTheDocument();
  expect(screen.getByText('内容')).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run --cwd packages/ui test`
Expected: FAIL，新组件不存在。

- [ ] **Step 3: 实现壳层与权限组件**

复制 `PageContainer`、`Breadcrumbs` 及其 CSS，修正相对导入（`./Breadcrumbs`、`./PageContainer.module.css`）。

`AdminShell`/`Sidebar`/`SidebarMenu`/`Header` 为新写的通用版本，不复用商家端的收藏编辑逻辑：

- `Sidebar` 使用 `usePathname()`；激活判断为 `pathname === item.url || pathname.startsWith(`${item.url}/`)`，不使用 `indexOf`。
- 折叠状态用组件内 `useState`，不依赖 `zustand`。
- 群组用 `<details open>`；叶子用 `next/link`。
- `Header` 显示 `account.name`；退出按钮调用 `signOut({ callbackUrl: '/login' })`。
- 所有含交互的组件文件首行 `'use client'`。

`permission.tsx`：`PermissionProvider` 把数组转成 `Set` 放入 context；`Can` 未授权返回 `fallback ?? null`；`PermissionButton` 未授权返回 `null`，否则透传 `ButtonProps` 给 `Button`。`Forbidden` 显示“403 / 无权访问该页面”和返回首页链接。

在 `src/index.ts` 追加以上导出及类型。

- [ ] **Step 4: 验证并提交**

```bash
bun run --cwd packages/ui test
bun run --cwd packages/ui typecheck
bun run --cwd packages/ui lint
git add packages/ui
git commit -m "feat(ui): add shared shell and permission components"
```

---

### Task 6: `apps/ops-admin` 脚手架与 `commerce_ops` 数据层

**Files:**

- Create: `apps/ops-admin/package.json`
- Create: `apps/ops-admin/next.config.ts`
- Create: `apps/ops-admin/tsconfig.json`
- Create: `apps/ops-admin/vitest.config.ts`
- Create: `apps/ops-admin/tests/setup.ts`
- Create: `apps/ops-admin/tests/global-setup.ts`
- Create: `apps/ops-admin/tests/db/prisma-schema.test.ts`
- Create: `apps/ops-admin/app/layout.tsx`、`globals.css`、`providers.tsx`、`page.tsx`
- Create: `apps/ops-admin/app/api/health/route.ts`
- Create: `apps/ops-admin/styles/tokens.css`、`styles/reset.css`（从商家端复制）
- Create: `apps/ops-admin/prisma/schema.prisma`
- Create: `apps/ops-admin/prisma/seed.ts`
- Create: `apps/ops-admin/lib/db/client.ts`
- Create: `apps/ops-admin/lib/db/index.ts`
- Create: `apps/ops-admin/lib/db/seed/index.ts`（Task 7 前为仅写 `SeedMeta` 的占位）
- Modify: `scripts/dev-bootstrap.mjs`
- Modify: `.env.example`
- Modify: `turbo.json`
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**

- Consumes: `@mtm/ui`（验证 `transpilePackages` 与 CSS Modules 可用）。
- Produces:
  - 包 `@mtm/ops-admin`，开发端口 3001。
  - Prisma 客户端 `@/lib/generated/prisma`，连接 `OPS_DATABASE_URL`。
  - `initDatabase(): Promise<void>`（`SELECT 1` + `seedDatabase()`）。
  - 根脚本 `bun run dev` 会启动三个应用；`dev-bootstrap.mjs` 会创建 `commerce_ops` 与 `commerce_ops_test`。

- [ ] **Step 1: 写失败测试**

```ts
// apps/ops-admin/tests/db/prisma-schema.test.ts
// @vitest-environment node
import { afterAll, expect, test } from 'vitest';

import { prisma } from '@/lib/db/client';

afterAll(() => prisma.$disconnect());

test('connects to the migrated commerce_ops database', async () => {
  await expect(prisma.$queryRaw`SELECT 1`).resolves.toBeDefined();
  expect(await prisma.opsAccount.count()).toBe(0);
  await expect(prisma.seedMeta.count()).resolves.toBeTypeOf('number');
});
```

- [ ] **Step 2: 创建应用与依赖**

`package.json` 依赖：`@ant-design/nextjs-registry`、`@mtm/auth`、`@mtm/contracts`、`@mtm/ui`、`@prisma/client`、`@tanstack/react-query`、`antd`、`dayjs`、`next`、`next-auth`、`react`、`react-dom`、`zod`；devDependencies 与商家端一致（`@mtm/config`、Testing Library、`jsdom`、`prisma`、`typescript`、`vitest` 等）。脚本复制商家端并把端口改为 3001，测试脚本使用 `OPS_TEST_DATABASE_URL`：

```json
"dev": "node --env-file=../../.env node_modules/next/dist/bin/next dev -p 3001",
"start": "node --env-file=../../.env node_modules/next/dist/bin/next start -p 3001",
"db:migrate": "bun --env-file=../../.env x prisma migrate deploy",
"db:migrate:dev": "bun --env-file=../../.env x prisma migrate dev",
"db:reset": "bun --env-file=../../.env x prisma migrate reset --force --skip-seed && bun --env-file=../../.env prisma/seed.ts",
"db:seed": "bun --env-file=../../.env prisma/seed.ts",
"postinstall": "prisma generate",
"test": "bun --env-file=../../.env x vitest run"
```

`next.config.ts`：`output: 'standalone'`、`reactStrictMode: true`、`transpilePackages: ['@mtm/ui', '@mtm/auth', '@mtm/contracts']`。

`app/layout.tsx` 使用 `AntdRegistry`；`app/providers.tsx` 使用 `ConfigProvider`（`colorPrimary: '#1677ff'`）、`AntdApp`、`QueryClientProvider`、`ToastProvider`（来自 `@mtm/ui`）；标题使用“开源电商运营后台”，不得出现旧系统品牌。`app/page.tsx` 先放一个使用 `PageContainer` + `Empty` 的首页，证明 `@mtm/ui` 可用。

- [ ] **Step 3: 写 `commerce_ops` schema**

```prisma
generator client { provider = "prisma-client-js" output = "../lib/generated/prisma" }
datasource db { provider = "postgresql" url = env("OPS_DATABASE_URL") }

enum AccountStatus { ACTIVE DISABLED }
enum PermissionType { MENU BUTTON API }

model OpsAccount {
  id String @id @default(cuid())
  username String @unique
  passwordHash String
  name String
  status AccountStatus @default(ACTIVE)
  lastLoginAt DateTime?
  createdAt DateTime @default(now())
  roles OpsAccountRole[]
}

model OpsRole {
  id String @id @default(cuid())
  code String @unique
  name String
  permissions OpsRolePermission[]
  accounts OpsAccountRole[]
  merchantScopes OpsRoleMerchantScope[]
}

model OpsPermission {
  id String @id @default(cuid())
  code String @unique
  name String
  type PermissionType
  parentCode String?
  path String?
  icon String?
  sort Int @default(0)
  roles OpsRolePermission[]
}

model OpsAccountRole {
  accountId String
  roleId String
  account OpsAccount @relation(fields: [accountId], references: [id])
  role OpsRole @relation(fields: [roleId], references: [id])
  @@id([accountId, roleId])
  @@index([roleId])
}

model OpsRolePermission {
  roleId String
  permissionId String
  role OpsRole @relation(fields: [roleId], references: [id])
  permission OpsPermission @relation(fields: [permissionId], references: [id])
  @@id([roleId, permissionId])
  @@index([permissionId])
}

model OpsRoleMerchantScope {
  roleId String
  merchantId String
  role OpsRole @relation(fields: [roleId], references: [id])
  @@id([roleId, merchantId])
  @@index([merchantId])
}

model OpsLoginLog {
  id String @id @default(cuid())
  accountId String
  ip String?
  userAgent String?
  success Boolean
  createdAt DateTime @default(now())
  @@index([accountId, createdAt])
}

model OpsOperationLog {
  id String @id @default(cuid())
  accountId String
  action String
  resource String
  resourceId String?
  detail Json?
  createdAt DateTime @default(now())
  @@index([accountId, createdAt])
}

model OpsMenuItem {
  id String @id
  parentId String
  title String
  icon String?
  url String?
  code String?
  auth Boolean @default(false)
  index String?
  level Int @default(0)
  sortId Int @default(0)
  toolMenu Boolean @default(false)
  permissionCode String?
}

model SeedMeta {
  version String @id
  appliedAt DateTime @default(now())
}
```

`lib/db/client.ts` 与商家端相同（全局单例）；`lib/db/index.ts` 实现带缓存的 `initDatabase`。`prisma/seed.ts` 调用 `seedDatabase()` 后断开。`lib/db/seed/index.ts` 先实现：

```ts
export async function seedDatabase(): Promise<void> {
  await prisma.seedMeta.upsert({ where: { version: 'bootstrap' }, update: {}, create: { version: 'bootstrap' } });
}
```

`vitest.config.ts` 以 `OPS_TEST_DATABASE_URL` 为默认值，设置 `test.env.OPS_DATABASE_URL = TEST_URL`、`fileParallelism: false`、`globalSetup`。`tests/setup.ts` 设置 `process.env.OPS_DATABASE_URL`、`OPS_AUTH_SECRET ||= 'test-ops-secret'`、`CORE_API_JWT_SECRET ||= 'test-core-secret'`，并补齐浏览器 API。`tests/global-setup.ts` 复制商家端版本，校验 URL 含 `_test` 后执行 `prisma migrate reset --force --skip-seed --skip-generate`。

- [ ] **Step 4: 根目录接线**

- `scripts/dev-bootstrap.mjs`：`APPS` 加 `'apps/ops-admin'`；`DATABASES` 加 `'commerce_ops_test'`。
- `.env.example` 追加：

```bash
OPS_TEST_DATABASE_URL=postgresql://mtm:mtm@localhost:5432/commerce_ops_test?schema=public
OPS_AUTH_SECRET=change-me-ops
CORE_API_JWT_SECRET=change-me-core
CORE_API_URL=http://localhost:4000
```

- `turbo.json`：`globalEnv` 追加 `OPS_TEST_DATABASE_URL`、`OPS_AUTH_SECRET`、`CORE_API_JWT_SECRET`、`CORE_API_URL`；`dev.env` 同样追加。
- `.github/workflows/deploy.yml`：job `env` 追加 `OPS_TEST_DATABASE_URL`、`OPS_AUTH_SECRET: ci-ops-secret`、`CORE_API_JWT_SECRET: ci-core-secret`、`CORE_API_URL: http://localhost:4000`。
- 本地 `.env` 追加同样的四个变量（`OPS_AUTH_SECRET`/`CORE_API_JWT_SECRET` 用随机字符串，不用 `change-me`）。

- [ ] **Step 5: 生成迁移并验证**

```bash
bun install
bun scripts/dev-bootstrap.mjs
bun run --cwd apps/ops-admin db:migrate:dev -- --name init_ops
bun run --cwd apps/ops-admin test -- tests/db/prisma-schema.test.ts
bun run --cwd apps/ops-admin typecheck
bun run --cwd apps/ops-admin lint
```

Expected: `apps/ops-admin/prisma/migrations/<timestamp>_init_ops/migration.sql` 生成；测试通过。

- [ ] **Step 6: 提交**

```bash
git add apps/ops-admin scripts/dev-bootstrap.mjs .env.example turbo.json .github/workflows/deploy.yml bun.lock
git commit -m "feat(ops-admin): scaffold the ops portal and commerce_ops schema"
```

---

### Task 7: 运营端种子数据（权限、角色、管理员、菜单）

**Files:**

- Modify: `apps/ops-admin/lib/db/seed/index.ts`
- Create: `apps/ops-admin/lib/db/seed/auth.ts`
- Create: `apps/ops-admin/lib/db/seed/ids.ts`
- Create: `apps/ops-admin/tests/lib/db/auth-seed.test.ts`

**Interfaces:**

- Consumes: `@mtm/contracts` 的 `OPS_PERMISSIONS`、`PERMISSIONS`；`@mtm/auth/password` 的 `hashPassword`。
- Produces:
  - `OPS_AUTH_SEED_VERSION = '2026-11-03-ops-auth'`
  - `OPS_SEED_ADMIN_ID = 'ops-account-admin'`、`OPS_SEED_SUPER_ROLE_ID = 'ops-role-super-admin'`
  - `seedDatabase()` 在同一事务内写入权限、角色、账号、角色关联、菜单并记录 `SeedMeta`。

- [ ] **Step 1: 写失败测试**

```ts
import { verifyPassword } from '@mtm/auth/password';
import { afterAll, expect, test } from 'vitest';

import { prisma } from '@/lib/db/client';
import { seedDatabase } from '@/lib/db/seed';

afterAll(() => prisma.$disconnect());

test('seeds ops permissions, roles, admin and menus idempotently', async () => {
  await seedDatabase();
  await seedDatabase();

  expect(await prisma.opsPermission.count()).toBe(10);
  expect(await prisma.opsRole.count()).toBe(1);
  expect(await prisma.opsMenuItem.count()).toBe(9);

  const admin = await prisma.opsAccount.findUniqueOrThrow({
    where: { username: 'admin' },
    include: { roles: { include: { role: { include: { permissions: true } } } } },
  });
  expect(admin.roles).toHaveLength(1);
  expect(admin.roles[0].role.code).toBe('super-admin');
  expect(admin.roles[0].role.permissions).toHaveLength(10);
  await expect(verifyPassword(admin.passwordHash, 'admin123')).resolves.toBe(true);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run --cwd apps/ops-admin test -- tests/lib/db/auth-seed.test.ts`
Expected: FAIL，计数为 0。

- [ ] **Step 3: 实现种子**

权限行（`code`、`name`、`type`、`path`、`sort`）：

| code                    | name       | type   | path               | sort |
| ----------------------- | ---------- | ------ | ------------------ | ---- |
| `product:view`          | 商品查看   | MENU   | `/products`        | 10   |
| `product:audit`         | 商品审核   | MENU   | `/audits`          | 20   |
| `category:view`         | 类目查看   | MENU   | `/categories`      | 30   |
| `category:manage`       | 类目管理   | BUTTON | null               | 31   |
| `brand:manage`          | 品牌管理   | MENU   | `/brands`          | 40   |
| `merchant:view`         | 商家查看   | MENU   | `/merchants`       | 50   |
| `shop:view`             | 店铺查看   | BUTTON | null               | 51   |
| `account:manage`        | 账号管理   | MENU   | `/system/accounts` | 60   |
| `role:manage`           | 角色管理   | MENU   | `/system/roles`    | 61   |
| `platform:cross-tenant` | 跨商家访问 | API    | null               | 90   |

角色 `super-admin` 关联全部 10 个权限；账号 `admin`、`name='超级管理员'`、密码 `admin123`；关联角色。

菜单（`id`、`title`、`url`、`parentId`、`level`、`index`、`permissionCode`）：

| id                         | title    | url                | parentId          | level | index | permissionCode   |
| -------------------------- | -------- | ------------------ | ----------------- | ----- | ----- | ---------------- |
| `ops-menu-dashboard`       | 仪表盘   | `/`                | `-1`              | 0     | `1`   | null             |
| `ops-menu-products`        | 商品管理 | `/products`        | `-1`              | 0     | `10`  | `product:view`   |
| `ops-menu-categories`      | 类目管理 | `/categories`      | `-1`              | 0     | `20`  | `category:view`  |
| `ops-menu-brands`          | 品牌管理 | `/brands`          | `-1`              | 0     | `30`  | `brand:manage`   |
| `ops-menu-audits`          | 商品审核 | `/audits`          | `-1`              | 0     | `40`  | `product:audit`  |
| `ops-menu-merchants`       | 商家管理 | `/merchants`       | `-1`              | 0     | `50`  | `merchant:view`  |
| `ops-menu-system`          | 系统管理 | ``                 | `-1`              | 0     | `90`  | null             |
| `ops-menu-system-accounts` | 账号管理 | `/system/accounts` | `ops-menu-system` | 1     | `1`   | `account:manage` |
| `ops-menu-system-roles`    | 角色管理 | `/system/roles`    | `ops-menu-system` | 1     | `2`   | `role:manage`    |

实现要求：权限按 `code` 做 `upsert`；角色按 `code` 做 `upsert` 并 `set` 权限关联；管理员按 `username` 做 `upsert`（`update` 不覆盖 `passwordHash`，避免重置密码）；菜单按 `id` 做 `upsert`；`SeedMeta` 命中 `OPS_AUTH_SEED_VERSION` 时整体跳过。密码哈希只在首次创建时计算。

`seedDatabase()` 先用 `findUnique` 检查版本，未应用才执行 `seedOpsAuth()`；执行完写 `SeedMeta`。同一个事务内完成，避免半成品数据。

- [ ] **Step 4: 验证并提交**

```bash
bun run --cwd apps/ops-admin test -- tests/lib/db/auth-seed.test.ts
bun run --cwd apps/ops-admin typecheck
git add apps/ops-admin
git commit -m "feat(ops-admin): seed permissions, super admin and menus"
```

---

### Task 8: 运营端密码登录、会话与登录日志

**Files:**

- Create: `apps/ops-admin/lib/env.ts`
- Create: `apps/ops-admin/lib/auth.config.ts`
- Create: `apps/ops-admin/lib/auth.ts`
- Create: `apps/ops-admin/lib/auth-guard.ts`
- Create: `apps/ops-admin/lib/rate-limit.ts`
- Create: `apps/ops-admin/lib/services/account.ts`
- Create: `apps/ops-admin/lib/validation/auth.ts`
- Create: `apps/ops-admin/types/next-auth.d.ts`
- Create: `apps/ops-admin/middleware.ts`
- Create: `apps/ops-admin/app/api/auth/[...nextauth]/route.ts`
- Create: `apps/ops-admin/app/(auth)/layout.tsx`、`app/(auth)/auth.module.css`、`app/(auth)/login/page.tsx`
- Create: `apps/ops-admin/components/auth/LoginForm/index.tsx`、`index.module.css`
- Create: `apps/ops-admin/tests/lib/auth/authorize.test.ts`
- Create: `apps/ops-admin/tests/lib/auth-config.test.ts`
- Create: `apps/ops-admin/tests/components/LoginForm.test.tsx`

**Interfaces:**

- Consumes: `@mtm/auth/password`、`@mtm/auth/rate-limit`、Task 7 的种子账号。
- Produces:
  - `authenticateOpsUser(username: string, password: string): Promise<OpsSessionUser | null>`，其中 `OpsSessionUser = { id; accountId; username; name; portal: 'ops' }`
  - `requireOpsAccount(): Promise<{ accountId: string; username: string; name: string }>`（未登录抛 401 `AppError`）
  - 会话 Cookie `ops.session`（生产 `__Secure-ops.session`）
  - 会话 claim：`accountId`、`username`、`name`、`portal`

- [ ] **Step 1: 写失败测试**

```ts
import { afterAll, beforeEach, expect, test } from 'vitest';

import { authenticateOpsUser } from '@/lib/auth';
import { initDatabase } from '@/lib/db';
import { prisma } from '@/lib/db/client';
import { opsLoginLimiter } from '@/lib/rate-limit';

afterAll(() => prisma.$disconnect());
beforeEach(async () => {
  await initDatabase();
  opsLoginLimiter.clear();
});

test('authenticates the seeded admin and records success', async () => {
  const user = await authenticateOpsUser('admin', 'admin123');
  expect(user).toMatchObject({ username: 'admin', portal: 'ops' });
  expect(await prisma.opsLoginLog.count({ where: { success: true } })).toBeGreaterThan(0);
  const admin = await prisma.opsAccount.findUniqueOrThrow({ where: { username: 'admin' } });
  expect(admin.lastLoginAt).not.toBeNull();
});

test('returns null for wrong passwords, unknown users and disabled accounts', async () => {
  expect(await authenticateOpsUser('admin', 'wrong')).toBeNull();
  expect(await authenticateOpsUser('nobody', 'whatever')).toBeNull();

  await prisma.opsAccount.create({
    data: { username: 'disabled-user', passwordHash: 'x', name: '停用', status: 'DISABLED' },
  });
  expect(await authenticateOpsUser('disabled-user', 'x')).toBeNull();
  expect(await prisma.opsLoginLog.count({ where: { success: false } })).toBeGreaterThan(0);
});

test('blocks after five failures even with the correct password', async () => {
  for (let i = 0; i < 5; i += 1) await authenticateOpsUser('admin', 'wrong');
  expect(await authenticateOpsUser('admin', 'admin123')).toBeNull();
  opsLoginLimiter.reset('ops:admin');
  expect(await authenticateOpsUser('admin', 'admin123')).not.toBeNull();
});
```

`LoginForm` 测试： mock `next-auth/react`，输入用户名/密码后断言调用 `signIn('credentials', { username: 'admin', password: 'admin123', redirect: false })`；失败时 toast 显示“用户名或密码错误”。

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run --cwd apps/ops-admin test -- tests/lib/auth tests/components/LoginForm.test.tsx`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现认证**

`auth.config.ts`（Edge 安全，不导入数据库/`next/headers`）：

```ts
secret: process.env.OPS_AUTH_SECRET,
trustHost: true,
useSecureCookies: process.env.NODE_ENV === 'production',
session: { strategy: 'jwt', maxAge: 2 * 60 * 60 },
pages: { signIn: '/login' },
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === 'production' ? '__Secure-ops.session' : 'ops.session',
    options: { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production' },
  },
},
callbacks: { redirect, jwt, session },
```

`jwt` 写入 `accountId`、`username`、`name`、`portal='ops'`；`session` 归一化为字符串。`redirect` 复制商家端的相对路径防开放重定向实现。

`auth.ts`：单个 `Credentials` provider（id 默认 `credentials`），字段 `username`、`password`，`authorize` 调用 `authenticateOpsUser`。实现：

```ts
export async function authenticateOpsUser(username: string, password: string) {
  await initDatabase();
  assertProductionSecret('OPS_AUTH_SECRET');
  const key = `ops:${username.trim().toLowerCase()}`;
  if (opsLoginLimiter.isBlocked(key)) return null;

  const account = await prisma.opsAccount.findUnique({ where: { username: username.trim() } });
  if (!account || account.status !== 'ACTIVE') {
    opsLoginLimiter.recordFailure(key);
    return null;
  }

  const valid = await verifyPassword(account.passwordHash, password);
  await prisma.opsLoginLog.create({ data: { accountId: account.id, ip: null, userAgent: null, success: valid } });

  if (!valid) {
    opsLoginLimiter.recordFailure(key);
    return null;
  }

  opsLoginLimiter.reset(key);
  await prisma.opsAccount.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });
  return {
    id: account.id,
    accountId: account.id,
    username: account.username,
    name: account.name,
    portal: 'ops' as const,
  };
}
```

未知用户同样 `recordFailure`，但不写日志（`OpsLoginLog.accountId` 非空）。

`lib/env.ts` 的 `assertProductionSecret(name)`：生产环境变量缺失或等于 `change-me*` 时抛错。

`middleware.ts` 与商家端同构，公共路径仅 `/login`，`matcher` 排除 `api` 与静态资源。

登录页使用 `@mtm/ui` 的 `Form`/`Field`/`Input`/`Button`，页面标题“运营后台登录”。

- [ ] **Step 4: 验证并提交**

```bash
bun run --cwd apps/ops-admin test -- tests/lib/auth tests/components/LoginForm.test.tsx
bun run --cwd apps/ops-admin typecheck
git add apps/ops-admin
git commit -m "feat(ops-admin): add username/password auth and login auditing"
```

---

### Task 9: 运营端权限快照、菜单过滤、壳层与 403

**Files:**

- Create: `apps/ops-admin/lib/services/permission.ts`
- Create: `apps/ops-admin/lib/services/menu.ts`
- Create: `apps/ops-admin/lib/menu-tree.ts`（复制商家端 `listToTree`）
- Create: `apps/ops-admin/lib/page-guard.ts`
- Create: `apps/ops-admin/lib/services/operation-log.ts`
- Create: `apps/ops-admin/app/(dashboard)/layout.tsx`
- Create: `apps/ops-admin/app/(dashboard)/page.tsx`
- Create: `apps/ops-admin/app/(dashboard)/403/page.tsx`
- Create 占位页：`products/page.tsx`、`categories/page.tsx`、`brands/page.tsx`、`audits/page.tsx`、`merchants/page.tsx`
- Create: `apps/ops-admin/app/api/menu/route.ts`、`app/api/account/route.ts`
- Create: `apps/ops-admin/tests/lib/services/permission.test.ts`
- Create: `apps/ops-admin/tests/lib/services/menu.test.ts`
- Create: `apps/ops-admin/tests/lib/page-guard.test.ts`

**Interfaces:**

- Consumes: `@mtm/auth/menu-filter`、`@mtm/contracts`、Task 7 数据。
- Produces:
  - `interface PermissionSnapshot { codes: string[]; set: Set<string>; isCrossTenant: boolean; merchantScope: string[] | null }`
  - `getAccountPermissions(accountId: string): Promise<PermissionSnapshot>`
  - `getMenu(accountId: string): Promise<{ menuItems: MenuNodeDTO[] }>`，其中 `MenuNodeDTO = { id; title; icon; url; parentId; level; index; sortId; permissionCode: string | null; children?: MenuNodeDTO[]; last?: boolean }`
  - `requireOpsPermission(code: string): Promise<PermissionSnapshot>`（未登录 `redirect('/login')`，无权 `redirect('/403')`）
  - `writeOperationLog(input: { accountId; action; resource; resourceId?; detail? }): Promise<void>`

- [ ] **Step 1: 写失败测试**

```ts
// permission.test.ts
import { afterAll, expect, test } from 'vitest';

import { initDatabase } from '@/lib/db';
import { prisma } from '@/lib/db/client';
import { OPS_SEED_ADMIN_ID } from '@/lib/db/seed/ids';
import { getAccountPermissions } from '@/lib/services/permission';

afterAll(() => prisma.$disconnect());

test('super admin gets every permission and crosses tenants', async () => {
  await initDatabase();
  const snapshot = await getAccountPermissions(OPS_SEED_ADMIN_ID);
  expect(snapshot.codes).toHaveLength(10);
  expect(snapshot.isCrossTenant).toBe(true);
  expect(snapshot.merchantScope).toBeNull();
});

test('a scoped role only gets its permissions and merchant scope', async () => {
  await initDatabase();
  const permission = await prisma.opsPermission.findUniqueOrThrow({ where: { code: 'merchant:view' } });
  const role = await prisma.opsRole.create({
    data: {
      code: 'scoped-test',
      name: '受限角色',
      permissions: { create: [{ permissionId: permission.id }] },
      merchantScopes: { create: [{ merchantId: 'm1' }, { merchantId: 'm2' }] },
    },
  });
  const account = await prisma.opsAccount.create({
    data: {
      username: 'scoped-test-user',
      passwordHash: 'x',
      name: '受限账号',
      roles: { create: [{ roleId: role.id }] },
    },
  });

  const snapshot = await getAccountPermissions(account.id);
  expect(snapshot.codes).toEqual(['merchant:view']);
  expect(snapshot.isCrossTenant).toBe(false);
  expect(snapshot.merchantScope).toEqual(['m1', 'm2']);
});
```

```ts
// menu.test.ts
import { afterAll, expect, test } from 'vitest';

import { initDatabase } from '@/lib/db';
import { prisma } from '@/lib/db/client';
import { OPS_SEED_ADMIN_ID } from '@/lib/db/seed/ids';
import { getMenu } from '@/lib/services/menu';

afterAll(() => prisma.$disconnect());

test('super admin sees the whole ops menu', async () => {
  await initDatabase();
  const { menuItems } = await getMenu(OPS_SEED_ADMIN_ID);
  expect(menuItems.map(item => item.id)).toContain('ops-menu-system');
  expect(menuItems.at(-1)?.last).toBe(true);
});

test('a role without account/role permissions loses that branch', async () => {
  await initDatabase();
  const account = await prisma.opsAccount.create({
    data: { username: 'menu-limited', passwordHash: 'x', name: '菜单受限' },
  });
  const { menuItems } = await getMenu(account.id);
  const ids = JSON.stringify(menuItems);
  expect(ids).not.toContain('ops-menu-system-accounts');
  expect(ids).not.toContain('ops-menu-system-roles');
});
```

`page-guard.test.ts`：`vi.mock('next/navigation', () => ({ redirect: (url) => { throw new Error(`redirect:${url}`) } }))`、`vi.mock('@/lib/auth', ...)` 返回子账号；断言无权限时抛出 `redirect:/403`，有权限时返回快照。

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run --cwd apps/ops-admin test -- tests/lib/services tests/lib/page-guard.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现权限与菜单**

`getAccountPermissions`：一次查询账号带 `roles.role.permissions.permission` 与 `merchantScopes`；`codes` 去重；`isCrossTenant = codes.includes(PERMISSIONS.PLATFORM_CROSS_TENANT)`；`isCrossTenant ? null : 去重后的 merchantId 数组`。

`getMenu`：查询全部 `opsMenuItem`，按 `index` 数值排序，`listToTree`，用 `filterMenuTree` 过滤（把 `permissionCode` 保留在 DTO 中），标记最后一个根节点 `last = true`。

`layout.tsx`：`auth()` 无 `accountId` 时 `redirect('/login')`；`initDatabase()`；并行加载 `getMenu` 与 `getAccountPermissions`；用 `PermissionProvider permissions={snapshot.codes}` 包裹 `AdminShell`，`account` 取自会话；`export const dynamic = 'force-dynamic'`。

占位页统一调用 `await requireOpsPermission(<对应权限>)`，渲染 `PageContainer` 与 `Empty description='该模块将在后续阶段提供'`。`/403` 不检查权限，渲染 `<Forbidden />`。

`api/menu` 用 `withAuth` 返回 `getMenu(accountId)`；`api/account` 返回会话对应的运营账号基本信息。`withAuth`/`api-response`/`errors` 等从商家端复制，Task 10 再扩展 `withPermission`。

- [ ] **Step 4: 验证并提交**

```bash
bun run --cwd apps/ops-admin test -- tests/lib/services tests/lib/page-guard.test.ts
bun run --cwd apps/ops-admin typecheck
git add apps/ops-admin
git commit -m "feat(ops-admin): enforce permissions in menus and pages"
```

---

### Task 10: 运营端账号/角色服务与接口

**Files:**

- Create: `apps/ops-admin/lib/api-response.ts`、`lib/api-client.ts`、`lib/errors.ts`、`lib/handler.ts`、`lib/pagination.ts`（从商家端复制）
- Modify: `apps/ops-admin/lib/handler.ts`（追加 `withPermission`）
- Create: `apps/ops-admin/lib/validation/system.ts`
- Create: `apps/ops-admin/lib/services/account-admin.ts`
- Create: `apps/ops-admin/lib/services/role-admin.ts`
- Create: `apps/ops-admin/app/api/accounts/route.ts`
- Create: `apps/ops-admin/app/api/accounts/[id]/route.ts`
- Create: `apps/ops-admin/app/api/accounts/[id]/password/route.ts`
- Create: `apps/ops-admin/app/api/roles/route.ts`
- Create: `apps/ops-admin/app/api/roles/[id]/route.ts`
- Create: `apps/ops-admin/app/api/permissions/route.ts`
- Create: `apps/ops-admin/tests/lib/services/account-admin.test.ts`
- Create: `apps/ops-admin/tests/lib/services/role-admin.test.ts`
- Create: `apps/ops-admin/tests/lib/handler-permission.test.ts`

**Interfaces:**

- Consumes: `@mtm/contracts`、`@mtm/auth/password`、`OPS_PERMISSIONS`。
- Produces:
  - `interface OpsAccountDTO { id; username; name; status: 'ACTIVE' | 'DISABLED'; roles: { id; code; name }[]; lastLoginAt: string | null; createdAt: string }`
  - `listAccounts(query: { page: number; pageSize: number; keyword?: string; status?: 'ACTIVE' | 'DISABLED' }): Promise<{ items: OpsAccountDTO[]; total: number }>`
  - `createAccount(actorId, input: { username; name; password; roleIds: string[] }): Promise<OpsAccountDTO>`
  - `updateAccount(actorId, id, input: { name?; status?; roleIds? }): Promise<OpsAccountDTO>`
  - `resetAccountPassword(actorId, id, password: string): Promise<void>`
  - `interface OpsRoleDTO { id; code; name; permissions: string[]; merchantScope: string[]; accountCount: number }`
  - `listRoles(); createRole(actorId, input); updateRole(actorId, id, input)`
  - `listPermissions(): Promise<{ code; name; type; path; sort }[]>`
  - `withPermission<T>(permission: string, handler: ...)`：在 `withAuth` 基础上加载权限快照，无权限抛 `AppError('FORBIDDEN', 403, '无权访问')`。

- [ ] **Step 1: 写失败测试**

`account-admin.test.ts` 覆盖：

```ts
test('creates a sub-account with roles and logs the operation', async () => {
  await initDatabase();
  const role = await prisma.opsRole.findUniqueOrThrow({ where: { code: 'super-admin' } });
  const account = await createAccount(OPS_SEED_ADMIN_ID, {
    username: 'ops-test-user',
    name: '测试运营',
    password: 'password123',
    roleIds: [role.id],
  });
  expect(account.username).toBe('ops-test-user');
  expect(account.roles.map(item => item.code)).toEqual(['super-admin']);
  expect(await prisma.opsOperationLog.count({ where: { resource: 'ops-account', resourceId: account.id } })).toBe(1);
  await prisma.opsAccount.delete({ where: { id: account.id } });
});

test('rejects duplicate usernames, invalid roles and self-disable', async () => {
  await initDatabase();
  await expect(
    createAccount(OPS_SEED_ADMIN_ID, { username: 'admin', name: 'x', password: 'password123', roleIds: [] })
  ).rejects.toMatchObject({ code: 'USERNAME_TAKEN', status: 409 });
  await expect(updateAccount(OPS_SEED_ADMIN_ID, OPS_SEED_ADMIN_ID, { status: 'DISABLED' })).rejects.toMatchObject({
    code: 'SELF_DISABLE_FORBIDDEN',
    status: 403,
  });
});
```

`role-admin.test.ts` 覆盖：创建角色带权限与商家范围；非法权限码返回 `INVALID_PERMISSION`；`platform:cross-tenant` 时范围被清空；重复 code 返回 `ROLE_CODE_TAKEN`；`listPermissions` 返回 10 条。

`handler-permission.test.ts`：mock `requireAccount` 与 `getAccountPermissions`，断言无权限时响应 403、有权限时 200。

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run --cwd apps/ops-admin test -- tests/lib/services/account-admin.test.ts tests/lib/services/role-admin.test.ts tests/lib/handler-permission.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现**

校验（Zod）：

- 用户名 `^[a-zA-Z0-9._@-]{3,64}$`；姓名 1–50；密码 8–128；`roleIds` 为 `cuid` 字符串数组。
- 角色 `code` 同上正则；名称 1–50；`permissionCodes` 必须是 `OPS_PERMISSIONS` 子集；`merchantScope` 为字符串数组，去重。

业务规则：

- 账号：`username` 唯一冲突映射 409 `USERNAME_TAKEN`；`roleIds` 必须全部存在，否则 400 `INVALID_ROLE`；禁止把当前操作者自己设为 `DISABLED`（403 `SELF_DISABLE_FORBIDDEN`）；若目标当前拥有 `super-admin`，更新后不再拥有，且不存在其他启用状态的 `super-admin` 账号，则 409 `LAST_SUPER_ADMIN`。
- 角色：`code` 创建后不可修改；冲突 409 `ROLE_CODE_TAKEN`；`permissionCodes` 非法 400 `INVALID_PERMISSION`；包含 `platform:cross-tenant` 时 `merchantScope` 强制为 `[]`。
- 每次创建/更新/重置密码写一条 `OpsOperationLog`（`resource` 为 `ops-account`/`ops-role`，`action` 为 `create`/`update`/`reset-password`）。
- 密码哈希调用 `hashPassword`，不记录明文。

接口映射：

| 方法     | 路径                         | 权限             |
| -------- | ---------------------------- | ---------------- |
| GET/POST | `/api/accounts`              | `account:manage` |
| PATCH    | `/api/accounts/:id`          | `account:manage` |
| POST     | `/api/accounts/:id/password` | `account:manage` |
| GET/POST | `/api/roles`                 | `role:manage`    |
| PATCH    | `/api/roles/:id`             | `role:manage`    |
| GET      | `/api/permissions`           | `role:manage`    |

响应沿用门户信封 `{ code: 0, message: 'ok', data }`；错误沿用 `AppError`。

- [ ] **Step 4: 验证并提交**

```bash
bun run --cwd apps/ops-admin test -- tests/lib/services/account-admin.test.ts tests/lib/services/role-admin.test.ts tests/lib/handler-permission.test.ts
bun run --cwd apps/ops-admin typecheck
git add apps/ops-admin
git commit -m "feat(ops-admin): add account and role administration APIs"
```

---

### Task 11: 运营端账号/角色管理页面

**Files:**

- Create: `apps/ops-admin/app/(dashboard)/system/accounts/page.tsx`
- Create: `apps/ops-admin/app/(dashboard)/system/roles/page.tsx`
- Create: `apps/ops-admin/components/system/AccountManager/index.tsx`、`index.module.css`
- Create: `apps/ops-admin/components/system/RoleManager/index.tsx`、`index.module.css`
- Create: `apps/ops-admin/tests/components/AccountManager.test.tsx`
- Create: `apps/ops-admin/tests/components/RoleManager.test.tsx`

**Interfaces:**

- Consumes: Task 10 的 `/api/accounts`、`/api/roles`、`/api/permissions`；`@mtm/ui` 的 `DataTable`、`SearchForm`、`Dialog`、`Form`、`Field`、`Input`、`Select`、`Checkbox`、`Button`、`Tag`、`useToast`。
- Produces: 两个客户端管理组件，服务端页面只做权限守卫与渲染。

- [ ] **Step 1: 写失败测试**

`AccountManager`：mock `@/lib/api-client` 的 `apiFetch`，首次返回一条账号；断言渲染用户名与“新建账号”按钮；点击后填写用户名/姓名/密码并提交，断言 `apiFetch('/api/accounts', { method: 'POST', body: ... })`。

`RoleManager`：mock 返回一个角色与 10 条权限；断言权限复选框渲染；勾选后提交，断言 PATCH/POST 请求体包含 `permissionCodes`。

测试用 `QueryClientProvider` + `ToastProvider` + `PermissionProvider` 包裹；`next/navigation` mock 掉。

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run --cwd apps/ops-admin test -- tests/components/AccountManager.test.tsx tests/components/RoleManager.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 实现页面**

页面（服务端）：

```tsx
export default async function AccountsPage() {
  const session = await auth();
  await requireOpsPermission(PERMISSIONS.ACCOUNT_MANAGE);
  return <AccountManager currentAccountId={session!.user!.accountId} />;
}
```

`AccountManager`：TanStack Query `['ops','accounts', query]` 拉列表；`SearchForm` 关键字/状态；表格列“用户名、姓名、角色、状态、最近登录、操作”；操作含“编辑”“重置密码”“停用/启用”；新建/编辑用 `Dialog` + `Form`（React Hook Form + Zod）；提交后 `invalidateQueries`。

`RoleManager`：列表列“角色、权限数、账号数、商家范围、操作”；新建/编辑用 `Dialog`；权限按 `type` 分组展示为复选框；商家范围用 `Textarea`，提示“每行一个商家 ID；拥有跨商家权限时忽略”；服务端提交为数组。

所有按钮使用 `PermissionButton` 或页面已守卫，不在前端做安全判断。

- [ ] **Step 4: 验证并提交**

```bash
bun run --cwd apps/ops-admin test -- tests/components/AccountManager.test.tsx tests/components/RoleManager.test.tsx
bun run --cwd apps/ops-admin typecheck
bun run --cwd apps/ops-admin build
git add apps/ops-admin
git commit -m "feat(ops-admin): add account and role management screens"
```

---

### Task 12: 商家端角色租户隔离与认证种子

**Files:**

- Modify: `apps/merchant-admin/prisma/schema.prisma`（`MerchantRole` 增加 `merchantId`，`code` 改为复合唯一）
- Create: `apps/merchant-admin/prisma/migrations/<timestamp>_merchant_role_scope/migration.sql`
- Create: `apps/merchant-admin/lib/db/seed/auth.ts`
- Modify: `apps/merchant-admin/lib/db/seed/index.ts`
- Modify: `apps/merchant-admin/lib/db/seed/ids.ts`
- Modify: `apps/merchant-admin/lib/db/seed/types.ts`（`MenuItemRow` 增加 `permissionCode`）
- Modify: `apps/merchant-admin/lib/db/seed/transformers.ts`（`normalizeMenuItem` 默认 `permissionCode: null`）
- Modify: `apps/merchant-admin/tests/lib/db/core-seed.test.ts`
- Modify: `apps/merchant-admin/tests/lib/db/prisma-seed.test.ts`
- Create: `apps/merchant-admin/tests/lib/db/auth-seed.test.ts`

**Interfaces:**

- Consumes: `@mtm/contracts`、`@mtm/auth/password`。
- Produces:
  - `MERCHANT_AUTH_SEED_VERSION = '2026-11-03-merchant-auth'`
  - ID 常量：`SEED_OWNER_ROLE_ID = 'merchant-role-owner'`、`SEED_STAFF_ROLE_ID = 'merchant-role-staff'`、`SEED_STAFF_ACCOUNT_ID = 'merchant-account-staff'`
  - 主账号 `username='merchant@example.com'`、`passwordHash` 对应 `merchant123`、`isOwner=true`
  - 子账号 `staff@example.com / staff123`、`isOwner=false`、角色 `staff`
  - 商家角色按 `merchantId` 隔离

- [ ] **Step 1: 写失败测试**

```ts
import { verifyPassword } from '@mtm/auth/password';
import { MERCHANT_PERMISSIONS } from '@mtm/contracts';
import { afterAll, expect, test } from 'vitest';

import { prisma, initDatabase } from '@/lib/db';
import { SEED_MERCHANT_ID, SEED_STAFF_ACCOUNT_ID } from '@/lib/db/seed/ids';

afterAll(() => prisma.$disconnect());

test('seeds owner and staff accounts with scoped roles', async () => {
  await initDatabase();
  await initDatabase();

  const owner = await prisma.merchantAccount.findUniqueOrThrow({ where: { username: 'merchant@example.com' } });
  expect(owner.isOwner).toBe(true);
  expect(owner.phone).toBe('13412345678');
  await expect(verifyPassword(owner.passwordHash!, 'merchant123')).resolves.toBe(true);

  const staff = await prisma.merchantAccount.findUniqueOrThrow({
    where: { username: 'staff@example.com' },
    include: { roles: { include: { role: true } } },
  });
  expect(staff.id).toBe(SEED_STAFF_ACCOUNT_ID);
  expect(staff.isOwner).toBe(false);
  await expect(verifyPassword(staff.passwordHash!, 'staff123')).resolves.toBe(true);
  expect(staff.roles[0].role.code).toBe('staff');

  expect(await prisma.merchantPermission.count()).toBe(MERCHANT_PERMISSIONS.length);
  const roles = await prisma.merchantRole.findMany({ where: { merchantId: SEED_MERCHANT_ID } });
  expect(roles.map(role => role.code).sort()).toEqual(['owner', 'staff']);

  const accountMenus = await prisma.menuItem.findMany({ where: { permissionCode: 'account:manage' } });
  expect(accountMenus.map(item => item.url)).toEqual(
    expect.arrayContaining(['/system/accounts', '/staff/sub-account'])
  );
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run --cwd apps/merchant-admin test -- tests/lib/db/auth-seed.test.ts`
Expected: FAIL。

- [ ] **Step 3: 修改 schema 与迁移**

`MerchantRole`：

```prisma
model MerchantRole {
  id          String                   @id @default(cuid())
  merchantId  String
  code        String
  name        String
  permissions MerchantRolePermission[]
  accounts    MerchantAccountRole[]

  @@unique([merchantId, code])
  @@index([merchantId])
}
```

生成迁移：

```bash
bun run --cwd apps/merchant-admin db:migrate:dev -- --name merchant_role_scope
```

把生成的 `migration.sql` 中新增列改成可回填形式：

```sql
ALTER TABLE "MerchantRole" ADD COLUMN "merchantId" TEXT;
UPDATE "MerchantRole" SET "merchantId" = '1' WHERE "merchantId" IS NULL;
ALTER TABLE "MerchantRole" ALTER COLUMN "merchantId" SET NOT NULL;
DROP INDEX IF EXISTS "MerchantRole_code_key";
CREATE UNIQUE INDEX "MerchantRole_merchantId_code_key" ON "MerchantRole"("merchantId", "code");
CREATE INDEX "MerchantRole_merchantId_idx" ON "MerchantRole"("merchantId");
```

- [ ] **Step 4: 实现认证种子**

`auth.ts` 在 `seedCore` 之后运行（`seedDatabase` 中追加版本检查）：

1. 写入 `MerchantPermission`：`code`、`name`、`type`、`path`、`sort`，名称参考运营端表格，商家端仅使用 `MERCHANT_PERMISSIONS`。
2. 写入 `owner` 角色（全部商家权限）与 `staff` 角色（`product:view`、`product:create`、`product:update`、`product:submit`、`shop:update`），`merchantId = SEED_MERCHANT_ID`。
3. 更新主账号：`username='merchant@example.com'`、`passwordHash=hashPassword('merchant123')`、`isOwner=true`、`status='ACTIVE'`。
4. 创建子账号：`staff@example.com`、姓名“演示子账号”、手机号 `13900000000`、`passwordHash=hashPassword('staff123')`、`isOwner=false`；关联 `staff` 角色。
5. 新增菜单：`seed-menu-system`（系统管理，`/` 空 URL，parent `-1`，index `200`）、`seed-menu-accounts`（账号管理，`/system/accounts`，`account:manage`）、`seed-menu-roles`（角色管理，`/system/roles`，`role:manage`）。
6. 通过 `updateMany` 给 `/staff/sub-account` 与 `/shop/admin` 设置 `permissionCode='account:manage'`。
7. 写入 `SeedMeta(MERCHANT_AUTH_SEED_VERSION)`。

`normalizeMenuItem` 输出 `permissionCode: typeof row.permissionCode === 'string' ? row.permissionCode : null`；`MenuItemRow` 同步加字段。

更新既有断言：`core-seed.test.ts` 的菜单数 54 → 57；`prisma-seed.test.ts` 的 `before` 期望 `{ menu: 57, categories: 173, favorites: 10 }`。

- [ ] **Step 5: 验证并提交**

```bash
bun run --cwd apps/merchant-admin test -- tests/lib/db
bun run --cwd apps/merchant-admin typecheck
git add apps/merchant-admin bun.lock
git commit -m "feat(merchant-admin): scope roles per merchant and seed auth data"
```

---

### Task 13: 商家端密码登录、Cookie 名与登录日志

**Files:**

- Modify: `apps/merchant-admin/lib/auth.config.ts`（Cookie 名、`name` claim）
- Modify: `apps/merchant-admin/lib/auth.ts`（新增 `password` provider）
- Modify: `apps/merchant-admin/lib/services/account.ts`（按用户名/手机号查找、写日志、更新登录时间、DTO 增加 `name`/`isOwner`）
- Create: `apps/merchant-admin/lib/rate-limit.ts`
- Modify: `apps/merchant-admin/lib/validation/auth.ts`（`passwordLoginSchema`）
- Modify: `apps/merchant-admin/components/auth/LoginForm/index.tsx`（验证码/密码两种方式）
- Modify: `apps/merchant-admin/scripts/session-cookie.ts`（Cookie 名与 `login`）
- Modify: `apps/merchant-admin/types/next-auth.d.ts`
- Create: `apps/merchant-admin/tests/lib/auth/authorize-password.test.ts`
- Modify: `apps/merchant-admin/tests/components/LoginForm.test.tsx`
- Modify: `apps/merchant-admin/tests/lib/auth-config.test.ts`

**Interfaces:**

- Consumes: `@mtm/auth/password`、`@mtm/auth/rate-limit`、Task 12 种子。
- Produces:
  - `authenticateMerchantPassword(identifier: string, password: string): Promise<MerchantSessionUser | null>`
  - Auth.js provider id `password`；`signIn('password', { identifier, password, redirect: false })`
  - Cookie `merchant.session`（生产 `__Secure-merchant.session`）
  - 登录失败限流键 `merchant:<小写标识>`，5 次 / 15 分钟

- [ ] **Step 1: 写失败测试**

```ts
import { afterAll, beforeEach, expect, test } from 'vitest';

import { authenticateMerchantPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { merchantLoginLimiter } from '@/lib/rate-limit';

afterAll(() => prisma.$disconnect());
beforeEach(() => merchantLoginLimiter.clear());

test('authenticates owner and staff by username or phone', async () => {
  await expect(authenticateMerchantPassword('merchant@example.com', 'merchant123')).resolves.toMatchObject({
    login: 'merchant@example.com',
  });
  await expect(authenticateMerchantPassword('13412345678', 'merchant123')).resolves.toMatchObject({
    accountId: '1',
  });
  await expect(authenticateMerchantPassword('staff@example.com', 'staff123')).resolves.toMatchObject({
    login: 'staff@example.com',
  });
});

test('rejects wrong passwords, disabled accounts and after five failures', async () => {
  expect(await authenticateMerchantPassword('staff@example.com', 'wrong')).toBeNull();
  await prisma.merchantAccount.update({ where: { username: 'staff@example.com' }, data: { status: 'DISABLED' } });
  expect(await authenticateMerchantPassword('staff@example.com', 'staff123')).toBeNull();
  await prisma.merchantAccount.update({ where: { username: 'staff@example.com' }, data: { status: 'ACTIVE' } });

  for (let i = 0; i < 5; i += 1) await authenticateMerchantPassword('staff@example.com', 'wrong');
  expect(await authenticateMerchantPassword('staff@example.com', 'staff123')).toBeNull();
});

test('writes login logs for known accounts', async () => {
  const before = await prisma.merchantLoginLog.count();
  await authenticateMerchantPassword('merchant@example.com', 'wrong');
  await authenticateMerchantPassword('merchant@example.com', 'merchant123');
  expect(await prisma.merchantLoginLog.count()).toBe(before + 2);
});
```

`LoginForm` 测试追加：点击“账号密码登录”页签，输入标识与密码，断言 `signIn('password', { identifier, password, redirect: false })`；原验证码用例保持通过。

`auth-config.test.ts` 追加：`authConfig.cookies.sessionToken.name` 在测试环境为 `merchant.session`；`jwt` 回调写入 `name`。

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run --cwd apps/merchant-admin test -- tests/lib/auth tests/components/LoginForm.test.tsx tests/lib/auth-config.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现**

`authenticateMerchantPassword` 结构同运营端：

```ts
const account = await prisma.merchantAccount.findFirst({
  where: { OR: [{ username: identifier }, { phone: identifier }] },
});
```

未找到 → 记失败并返回 `null`（仍写限流，避免用户名枚举）；`status !== 'ACTIVE'` → 写失败日志（若账号存在）并返回 `null`；密码错误 → 失败日志 + 限流；成功 → 成功日志、`lastLoginAt`、清零限流，返回：

```ts
{ id, accountId, login: account.username, name: account.name, mobile: account.phone ?? '', interCode: account.interCode, merchantId: account.merchantId, portal: 'merchant' }
```

`auth.ts` 注册第二个 `Credentials({ id: 'password', ... })`，保留原验证码 provider 为 `credentials`；两者都先 `initDatabase()`、`assertProductionSecret()`。验证码登录在账号存在时也写成功/失败日志。

`auth.config.ts` 增加 `cookies.sessionToken`，名称按环境切换；`session` 回调补 `name`。`types/next-auth.d.ts` 相应扩展。

`scripts/session-cookie.ts` 的 Cookie 名改为 `merchant.session` / `__Secure-merchant.session`，`SEED_SESSION.login` 改为 `merchant@example.com`、`name` 改为 `演示商家管理员`。

`LoginForm` 使用 `Tabs`（来自 `@/components/ui`）切换“手机验证码 / 账号密码”；两种方式共用提交态与 toast；密码表单 Zod 校验非空。

- [ ] **Step 4: 验证并提交**

```bash
bun run --cwd apps/merchant-admin test -- tests/lib/auth tests/components/LoginForm.test.tsx tests/lib/auth-config.test.ts
bun run --cwd apps/merchant-admin typecheck
git add apps/merchant-admin
git commit -m "feat(merchant-admin): add password login and portal-scoped session"
```

---

### Task 14: 商家端权限快照、菜单过滤、页面守卫与 403

**Files:**

- Create: `apps/merchant-admin/lib/services/permission.ts`
- Modify: `apps/merchant-admin/lib/services/menu.ts`（按权限过滤菜单与收藏）
- Create: `apps/merchant-admin/lib/page-guard.ts`
- Modify: `apps/merchant-admin/app/(admin)/layout.tsx`（`PermissionProvider`）
- Modify: `apps/merchant-admin/components/layout/Header/index.tsx`（显示姓名）
- Create: `apps/merchant-admin/app/(admin)/403/page.tsx`
- Create 占位页：`app/(admin)/system/accounts/page.tsx`、`app/(admin)/system/roles/page.tsx`（Task 16 替换）
- Modify: `apps/merchant-admin/next.config.ts`（`transpilePackages`）
- Modify: `apps/merchant-admin/package.json`（`@mtm/ui`、`@mtm/auth`、`@mtm/contracts`）
- Create: `apps/merchant-admin/tests/lib/services/permission.test.ts`
- Modify: `apps/merchant-admin/tests/lib/services/core.test.ts`
- Create: `apps/merchant-admin/tests/lib/page-guard.test.ts`

**Interfaces:**

- Consumes: `@mtm/auth/menu-filter`、`@mtm/contracts`。
- Produces:
  - `getAccountPermissions(accountId): Promise<{ codes: string[]; set: Set<string>; isOwner: boolean }>`
  - `requireMerchantPermission(code: string): Promise<PermissionSnapshot>`（未登录 `redirect('/login')`，无权 `redirect('/403')`）
  - `getMenu(accountId)` 签名不变，内部按权限过滤 `menuItems` 与 `favorites`

- [ ] **Step 1: 写失败测试**

```ts
import { MERCHANT_PERMISSIONS } from '@mtm/contracts';
// permission.test.ts
import { afterAll, expect, test } from 'vitest';

import { prisma, initDatabase } from '@/lib/db';
import { SEED_ACCOUNT_ID, SEED_STAFF_ACCOUNT_ID } from '@/lib/db/seed/ids';
import { getAccountPermissions } from '@/lib/services/permission';

afterAll(() => prisma.$disconnect());

test('owner gets every merchant permission', async () => {
  await initDatabase();
  const snapshot = await getAccountPermissions(SEED_ACCOUNT_ID);
  expect(snapshot.isOwner).toBe(true);
  expect(snapshot.codes.sort()).toEqual([...MERCHANT_PERMISSIONS].sort());
});

test('staff gets only its role permissions', async () => {
  await initDatabase();
  const snapshot = await getAccountPermissions(SEED_STAFF_ACCOUNT_ID);
  expect(snapshot.isOwner).toBe(false);
  expect(snapshot.codes.sort()).toEqual([
    'product:create',
    'product:submit',
    'product:update',
    'product:view',
    'shop:update',
  ]);
  expect(snapshot.set.has('account:manage')).toBe(false);
});
```

`core.test.ts` 追加：子账号调用 `getMenu` 后，序列化结果不含 `/system/accounts`、`/system/roles`、`/staff/sub-account`；主账号结果包含。再给子账号插入一条指向隐藏菜单的收藏，断言 `favorites` 不含该项，测试后清理。

`page-guard.test.ts`：mock `@/lib/auth` 为子账号、mock `next/navigation` 的 `redirect` 抛错；断言 `requireMerchantPermission('account:manage')` 抛 `redirect:/403`，`requireMerchantPermission('product:view')` 正常返回。

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run --cwd apps/merchant-admin test -- tests/lib/services/permission.test.ts tests/lib/services/core.test.ts tests/lib/page-guard.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现**

`getAccountPermissions`：

- 查 `merchantAccount`；不存在抛 404。
- `isOwner` 为真 → 读取全部 `MerchantPermission.code`。
- 否则 `roles.role.permissions.permission.code` 去重。
- 返回 `codes`、`set`、`isOwner`。

`getMenu`：先取权限快照；查询全部 `menuItem`（带 `permissionCode`），排序、`listToTree`、`filterMenuTree`、标记 `last`；收藏只保留 `filteredIds` 内的项。

`layout.tsx`：并行加载 `menu`、`badges`、`account`、`permissions`；用 `PermissionProvider` 包裹 `AdminShell`。`Header` 优先显示 `account.name`，没有则手机号。

`403` 页渲染 `@mtm/ui` 的 `Forbidden`。`/system/*` 占位页分别调用 `requireMerchantPermission(PERMISSIONS.ACCOUNT_MANAGE / ROLE_MANAGE)`。

`next.config.ts` 增加 `transpilePackages: ['@mtm/ui', '@mtm/auth', '@mtm/contracts']`。

- [ ] **Step 4: 验证并提交**

```bash
bun run --cwd apps/merchant-admin test -- tests/lib/services/permission.test.ts tests/lib/services/core.test.ts tests/lib/page-guard.test.ts
bun run --cwd apps/merchant-admin typecheck
bun run --cwd apps/merchant-admin build
git add apps/merchant-admin bun.lock
git commit -m "feat(merchant-admin): filter menus and enforce page permissions"
```

---

### Task 15: 商家端子账号/角色服务与接口

**Files:**

- Modify: `apps/merchant-admin/lib/handler.ts`（追加 `withPermission`）
- Create: `apps/merchant-admin/lib/validation/system.ts`
- Create: `apps/merchant-admin/lib/services/account-admin.ts`
- Create: `apps/merchant-admin/lib/services/role-admin.ts`
- Create: `apps/merchant-admin/lib/services/operation-log.ts`
- Create: `apps/merchant-admin/app/api/accounts/route.ts`
- Create: `apps/merchant-admin/app/api/accounts/[id]/route.ts`
- Create: `apps/merchant-admin/app/api/accounts/[id]/password/route.ts`
- Create: `apps/merchant-admin/app/api/roles/route.ts`
- Create: `apps/merchant-admin/app/api/roles/[id]/route.ts`
- Create: `apps/merchant-admin/app/api/permissions/route.ts`
- Create: `apps/merchant-admin/tests/lib/services/account-admin.test.ts`
- Create: `apps/merchant-admin/tests/lib/services/role-admin.test.ts`
- Create: `apps/merchant-admin/tests/lib/handler-permission.test.ts`

**Interfaces:**

- Consumes: `WITH auth` 上下文中的 `merchantId`、`MERCHANT_PERMISSIONS`、`hashPassword`。
- Produces:
  - `MerchantAccountDTO { id; username; name; phone; interCode; isOwner; status; roles: { id; code; name }[]; lastLoginAt; createdAt }`
  - `listAccounts(merchantId, query)`、`createAccount(actor, merchantId, input)`、`updateAccount(actor, merchantId, id, input)`、`resetAccountPassword(actor, merchantId, id, password)`
  - `listRoles(merchantId)`、`createRole(merchantId, input, actorId)`、`updateRole(merchantId, id, input, actorId)`、`listPermissions()`
  - `withPermission<T>(permission, handler)`（上下文含 `accountId`、`merchantId`、`permissions`）

- [ ] **Step 1: 写失败测试**

`account-admin.test.ts`：

```ts
test('owner creates a sub-account scoped to their merchant', async () => {
  await initDatabase();
  const role = await prisma.merchantRole.findUniqueOrThrow({
    where: { merchantId_code: { merchantId: SEED_MERCHANT_ID, code: 'staff' } },
  });
  const account = await createAccount(SEED_ACCOUNT_ID, SEED_MERCHANT_ID, {
    username: 'merchant-test-staff',
    name: '测试子账号',
    password: 'password123',
    roleIds: [role.id],
  });
  expect(account.username).toBe('merchant-test-staff');
  expect(await prisma.merchantOperationLog.count({ where: { resourceId: account.id } })).toBe(1);
  await prisma.merchantAccount.delete({ where: { id: account.id } });
});

test('non-owner actors and owner targets are rejected', async () => {
  await initDatabase();
  await expect(
    createAccount(SEED_STAFF_ACCOUNT_ID, SEED_MERCHANT_ID, {
      username: 'x1',
      name: 'x',
      password: 'password123',
      roleIds: [],
    })
  ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  await expect(
    updateAccount(SEED_ACCOUNT_ID, SEED_MERCHANT_ID, SEED_ACCOUNT_ID, { name: '改主账号' })
  ).rejects.toMatchObject({
    code: 'OWNER_IMMUTABLE',
    status: 403,
  });
});

test('roles from another merchant are rejected', async () => {
  await initDatabase();
  const other = await prisma.merchantRole.create({ data: { merchantId: '2', code: 'other', name: '其他商家角色' } });
  await expect(
    createAccount(SEED_ACCOUNT_ID, SEED_MERCHANT_ID, {
      username: 'x2',
      name: 'x',
      password: 'password123',
      roleIds: [other.id],
    })
  ).rejects.toMatchObject({ code: 'INVALID_ROLE', status: 400 });
  await prisma.merchantRole.delete({ where: { id: other.id } });
});
```

`role-admin.test.ts`：创建/更新角色；非法权限码 `INVALID_PERMISSION`；跨商家角色不可见；`code` 重复 `ROLE_CODE_TAKEN`；`listPermissions` 返回 `MERCHANT_PERMISSIONS.length` 条。

`handler-permission.test.ts`：mock 权限快照，断言无权限时 403、有权限时执行。

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run --cwd apps/merchant-admin test -- tests/lib/services/account-admin.test.ts tests/lib/services/role-admin.test.ts tests/lib/handler-permission.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现**

规则：

- 操作者必须是 `isOwner=true` 的主账号，否则 403 `FORBIDDEN`；`merchantId` 一律来自 handler 上下文。
- 创建/更新/重置密码的目标只能是本商家的子账号；目标是主账号时 403 `OWNER_IMMUTABLE`。
- 角色查询/关联都必须带当前 `merchantId`；`roleIds` 不属于本商家时 400 `INVALID_ROLE`。
- `MerchantRole` 的唯一键为 `merchantId + code`；重复 409 `ROLE_CODE_TAKEN`。
- 权限码必须是 `MERCHANT_PERMISSIONS` 子集，否则 400 `INVALID_PERMISSION`。
- 每次变更写 `MerchantOperationLog`（`resource='merchant-account'|'merchant-role'`）。
- 密码哈希调用 `hashPassword`。

接口与权限：

| 方法     | 路径                         | 权限             |
| -------- | ---------------------------- | ---------------- |
| GET/POST | `/api/accounts`              | `account:manage` |
| PATCH    | `/api/accounts/:id`          | `account:manage` |
| POST     | `/api/accounts/:id/password` | `account:manage` |
| GET/POST | `/api/roles`                 | `role:manage`    |
| PATCH    | `/api/roles/:id`             | `role:manage`    |
| GET      | `/api/permissions`           | `role:manage`    |

- [ ] **Step 4: 验证并提交**

```bash
bun run --cwd apps/merchant-admin test -- tests/lib/services/account-admin.test.ts tests/lib/services/role-admin.test.ts tests/lib/handler-permission.test.ts
bun run --cwd apps/merchant-admin typecheck
git add apps/merchant-admin
git commit -m "feat(merchant-admin): add sub-account and role administration APIs"
```

---

### Task 16: 商家端账号/角色管理页面

**Files:**

- Modify: `apps/merchant-admin/app/(admin)/system/accounts/page.tsx`
- Modify: `apps/merchant-admin/app/(admin)/system/roles/page.tsx`
- Create: `apps/merchant-admin/components/system/AccountManager/index.tsx`、`index.module.css`
- Create: `apps/merchant-admin/components/system/RoleManager/index.tsx`、`index.module.css`
- Create: `apps/merchant-admin/tests/components/AccountManager.test.tsx`
- Create: `apps/merchant-admin/tests/components/RoleManager.test.tsx`

**Interfaces:**

- Consumes: Task 15 的接口与 `@/components/ui`。
- Produces: 主账号可用的子账号/角色管理界面；子账号不可见、不可访问。

- [ ] **Step 1: 写失败测试**

与 Task 11 同构，但请求路径为 `/api/accounts`、`/api/roles`、`/api/permissions`，字段包含手机号；断言页面文案“子账号管理”“角色管理”，以及停用/启用操作发出 PATCH。

- [ ] **Step 2: 运行测试确认失败**

Run: `bun run --cwd apps/merchant-admin test -- tests/components/AccountManager.test.tsx tests/components/RoleManager.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 实现页面**

页面服务端调用 `requireMerchantPermission` 后渲染客户端组件（与 Task 14 占位页替换）。

- `AccountManager`：关键字/状态查询；表格列“用户名、姓名、手机号、角色、状态、最近登录、操作”；新建/编辑/重置密码/停用；字段校验与 Task 15 一致。
- `RoleManager`：角色列表与权限复选框（来自 `/api/permissions`）；编辑不会修改 `code`；提示“子账号按角色获得权限，主账号始终拥有全部权限”。
- 使用 `PermissionButton` 控制“新建”等按钮（UX 层），服务端仍是唯一安全边界。

- [ ] **Step 4: 验证并提交**

```bash
bun run --cwd apps/merchant-admin test -- tests/components/AccountManager.test.tsx tests/components/RoleManager.test.tsx
bun run --cwd apps/merchant-admin typecheck
bun run --cwd apps/merchant-admin build
git add apps/merchant-admin
git commit -m "feat(merchant-admin): add sub-account and role management screens"
```

---

### Task 17: 门户 BFF 与 `core-api` 服务间鉴权

**Files:**

- Modify: `apps/core-api/package.json`（`@mtm/auth`、`@mtm/contracts`）
- Create: `apps/core-api/src/auth.ts`
- Modify: `apps/core-api/src/app.ts`
- Modify: `apps/core-api/tests/health.test.ts`（保持可用）
- Create: `apps/core-api/tests/auth.test.ts`
- Create: `apps/ops-admin/lib/core-api.ts`
- Create: `apps/ops-admin/app/api/bff/[...path]/route.ts`
- Create: `apps/ops-admin/tests/lib/core-api.test.ts`
- Modify: `apps/ops-admin/app/(dashboard)/page.tsx`（显示核心服务连通状态）
- Create: `apps/merchant-admin/lib/core-api.ts`
- Create: `apps/merchant-admin/app/api/bff/[...path]/route.ts`
- Create: `apps/merchant-admin/tests/lib/core-api.test.ts`

**Interfaces:**

- Consumes: `@mtm/auth/service-token`、Task 9/Task 14 的权限快照。
- Produces:
  - core-api：`requireServiceToken` 中间件、`requirePermission(code)`、`GET /api/v1/me`。
  - 门户：`buildServiceToken(): Promise<string>`、`callCoreApi<T>(path, init?): Promise<T>`、`proxyToCoreApi(request, segments): Promise<Response>`。
  - `/api/bff/*` 浏览器同源代理。

- [ ] **Step 1: 写失败测试**

core-api：

```ts
process.env.CORE_API_JWT_SECRET = 'test-core-secret';

const app = createApp();
const secret = 'test-core-secret';
const valid = await signServiceToken(
  { portal: 'ops', userId: 'u1', merchantId: null, permissions: ['merchant:view'], merchantScope: ['m1'] },
  secret
);

test('rejects missing, expired and tampered tokens', async () => {
  expect((await app.request('/api/v1/me')).status).toBe(401);
  expect((await app.request('/api/v1/me', { headers: { authorization: `Bearer ${valid}x` } })).status).toBe(401);
});

test('echoes verified claims', async () => {
  const res = await app.request('/api/v1/me', { headers: { authorization: `Bearer ${valid}` } });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({
    data: { portal: 'ops', userId: 'u1', merchantId: null, permissions: ['merchant:view'], merchantScope: ['m1'] },
  });
});

test('fails closed without a secret', async () => {
  delete process.env.CORE_API_JWT_SECRET;
  expect((await app.request('/api/v1/me', { headers: { authorization: `Bearer ${valid}` } })).status).toBe(500);
  process.env.CORE_API_JWT_SECRET = secret;
});
```

另测 `requirePermission`：新建 `new Hono().use(requireServiceToken).get('/x', requirePermission('product:audit'), c => c.json({ ok: true }))`，无权限返回 403、有权限 200。

门户 `core-api.test.ts`：mock `@/lib/auth`、`@/lib/services/permission` 与全局 `fetch`；断言 `callCoreApi('/me')` 请求到 `${CORE_API_URL}/api/v1/me`，`Authorization` 为 `Bearer <token>`，且 `verifyServiceToken` 解出的 claims 包含 `portal`、`merchantId`/`merchantScope` 与权限；core-api 返回 `{ error: { code: 'FORBIDDEN' } }` 时抛 `ApiError` 且 code 保留。

- [ ] **Step 2: 运行测试确认失败**

```bash
bun run --cwd apps/core-api test -- tests/auth.test.ts
bun run --cwd apps/ops-admin test -- tests/lib/core-api.test.ts
bun run --cwd apps/merchant-admin test -- tests/lib/core-api.test.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现 core-api 鉴权**

`src/auth.ts`：

```ts
import { verifyServiceToken } from '@mtm/auth/service-token';
import type { ServiceTokenClaims } from '@mtm/auth/service-token';
import { createMiddleware } from 'hono/factory';

export type AuthVariables = { auth: ServiceTokenClaims };

export const requireServiceToken = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const secret = process.env.CORE_API_JWT_SECRET;
  if (!secret) {
    return c.json({ error: { code: 'CONFIGURATION_ERROR', message: '服务未正确配置', details: null } }, 500);
  }
  const header = c.req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    c.set('auth', await verifyServiceToken(token, secret));
  } catch {
    return c.json({ error: { code: 'UNAUTHORIZED', message: '未授权', details: null } }, 401);
  }
  await next();
});

export function requirePermission(code: string) {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    if (!c.get('auth').permissions.includes(code)) {
      return c.json({ error: { code: 'FORBIDDEN', message: '无权访问', details: null } }, 403);
    }
    await next();
  });
}
```

`app.ts` 改为 `const app = new Hono<{ Variables: AuthVariables }>()`；`/health` 保持公开；`app.use('/api/v1/*', requireServiceToken)`；`GET /api/v1/me` 返回 `{ data: c.get('auth') }`。

- [ ] **Step 4: 实现门户 BFF**

两个门户的 `lib/core-api.ts` 结构相同，差异只在快照来源：

```ts
export async function callCoreApi<T>(
  path: string,
  init: { method?: string; body?: unknown; search?: string } = {}
): Promise<T> {
  const token = await buildServiceToken();
  const url = `${process.env.CORE_API_URL ?? 'http://localhost:4000'}/api/v1${path}${init.search ? `?${init.search}` : ''}`;
  const response = await fetch(url, {
    method: init.method ?? 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      ...(init.body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const code = payload?.error?.code ?? 'CORE_API_ERROR';
    throw new ApiError(code, response.status, payload?.error?.message ?? '核心服务调用失败');
  }
  return payload.data as T;
}
```

`buildServiceToken`：

- 商家端：`portal='merchant'`、`userId=session.user.accountId`、`merchantId=session.user.merchantId`、`permissions=getAccountPermissions().codes`、`merchantScope=null`。
- 运营端：`portal='ops'`、`merchantId=null`、`permissions` 与 `merchantScope` 来自 `getAccountPermissions`。

BFF 路由导出 `GET`/`POST`/`PATCH`/`DELETE`，`params` 解构出 `path` 数组；仅允许 `^[a-zA-Z0-9/_-]+$` 段，拼接查询串后调用 `callCoreApi`；成功返回 `NextResponse.json({ data })` 以保持门户信封，错误交给 `fail()`。未登录时 `requireXAccount()` 已抛 401。

运营端首页在 `try/catch` 中调用 `callCoreApi('/me')`，成功显示“核心服务已连接”，失败显示“核心服务未连接”，不阻塞渲染。

- [ ] **Step 5: 验证并提交**

```bash
bun run --cwd apps/core-api test
bun run --cwd apps/ops-admin test -- tests/lib/core-api.test.ts
bun run --cwd apps/merchant-admin test -- tests/lib/core-api.test.ts
bun run --cwd apps/core-api typecheck
bun run --cwd apps/ops-admin typecheck
git add apps/core-api apps/ops-admin apps/merchant-admin bun.lock
git commit -m "feat(auth): bridge portals to core-api with signed service tokens"
```

---

### Task 18: 文档、环境说明与全量验证

**Files:**

- Modify: `README.asciidoc`
- Modify: `CLAUDE.md`
- Modify: `.env.example`（如 Task 6 有遗漏则补齐）
- Modify: `apps/merchant-admin/scripts/session-cookie.ts`（如 Task 13 未改则补）

**Interfaces:**

- Consumes: 前 17 个任务。
- Produces: 阶段 2 的交接文档与可重复验证步骤。

- [ ] **Step 1: 更新 README**

补充：

- 目录结构加入 `apps/ops-admin`、`packages/{contracts,auth,ui}`。
- 端口表：3000 商家端、3001 运营端、4000 core-api。
- 演示账号表：运营端 `admin / admin123`；商家主账号 `merchant@example.com / merchant123` 或手机号 `13412345678` + 图形验证码；子账号 `staff@example.com / staff123`。
- 权限模型简述：权限码集中、菜单按权限过滤、页面 403、接口校验、BFF 60 秒签名 JWT。
- 环境变量新增 `OPS_TEST_DATABASE_URL`、`OPS_AUTH_SECRET`、`CORE_API_JWT_SECRET`、`CORE_API_URL`；生产环境必须改掉演示密码和占位密钥。
- 明确“图形验证码仅用于演示，生产环境应关闭或接入短信服务”。
- 阶段说明更新为“阶段 2 已完成，下一阶段 3”。

- [ ] **Step 2: 更新 CLAUDE.md**

- “当前状态”改为阶段 1、2 已完成，下一阶段 3。
- 已定技术决策补充：`packages/contracts` 权限码、`packages/auth` 密码/签名/菜单过滤、`packages/ui` 共享壳层、两个门户独立 Cookie 与密钥。
- 必读文档加入本计划路径。
- “现有命令”补充运营端端口与演示账号。

- [ ] **Step 3: 全量验证**

```bash
bun install
bun run lint
bun run fmt:check
bun run typecheck
bun run test
bun run build
```

Expected: 全部通过；测试数量较阶段 1 增加。

- [ ] **Step 4: 手工冒烟**

```bash
bun run dev
```

检查：

1. `http://localhost:3001/login` 用 `admin/admin123` 登录，菜单显示 9 项目录，能创建角色（勾选权限、填写商家 ID）、创建子账号并停用/启用。
2. 用新建的受限运营账号登录（仅 `merchant:view`），菜单不显示系统管理；直接访问 `/system/accounts` 跳 `/403`。
3. `http://localhost:3000/login` 用 `merchant@example.com/merchant123` 登录，能看到“系统管理”；用 `staff@example.com/staff123` 登录看不到，直接访问 `/system/accounts` 跳 `/403`。
4. 两个门户的 Cookie 名分别为 `merchant.session`、`ops.session`；退出登录后回到各自 `/login`。
5. 运营端首页显示“核心服务已连接”；停掉 `core-api` 后刷新显示未连接，页面仍可用。

- [ ] **Step 5: 提交**

```bash
git add README.asciidoc CLAUDE.md .env.example apps/merchant-admin/scripts/session-cookie.ts
git commit -m "docs: document phase 2 auth, permissions and ops portal"
```

---

## Self-Review Notes

- 设计文档 6.2/7/9.3/9.4/10/11.3/12 的要求均有对应任务：数据模型 Task 6，权限码 Task 1/7/12，菜单与 403 Task 9/14，账号/角色管理 Task 10/11/15/16，BFF 与三层校验 Task 8/13/17，共享 UI Task 4/5。
- 本阶段不实现商品/类目/品牌/审核业务；运营端对应路由仅为带权限守卫的占位页。
- `MerchantRole` 增加 `merchantId` 是对设计 6.3 的必要补强：设计只给出省略字段的示意结构，但“跨商家只通过 ID 引用”“不信任请求参数”要求角色按商家隔离。
- `OpsMenuItem` 是设计 6.2 未列出、但 5/7.2 明确要求的运营端菜单表；本计划将其放在 `commerce_ops`。
- 测试中所有新增账号/角色均使用唯一名称并在用例结束清理，避免与其它测试文件相互影响。
