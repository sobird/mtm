# 阶段 3：类目 / 品牌 / 商家 / 上传 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打通 `core-api` 的类目、品牌、商家/店铺只读查询与商家自维护、图片上传，并在运营端落地类目 / 品牌 / 商家页面。

**Architecture:** `core-api`（Hono + `@hono/zod-openapi`）成为类目、品牌、商家/店铺、图片上传的唯一写入方；两个门户只通过同源 `/api/bff/*` 以 60 秒服务 JWT 调用。运营端管理类目与品牌、只读查看商家；商家端只读类目/品牌，并可维护自己的商家与店铺基础资料。图片写入本地 `core-api/var/uploads`，通过公开 `/uploads/*` 提供访问。

**Tech Stack:** Bun + Turborepo、Hono + `@hono/zod-openapi` + Zod 4、Prisma/PostgreSQL、Next.js 15 + React 19、TanStack Query、`@mtm/ui`、Vitest。

**Spec:** `docs/superpowers/specs/2026-11-03-open-commerce-admin-design.md`

## Global Constraints

- 零美团元素；所有种子商家、店铺、类目、品牌、商品、图片均为虚构数据。
- `commerce_core` 记录使用 cuid；种子允许固定可读 ID（如 `merchant-demo-1`），但不得使用自增整数作为业务主键。
- 跨库只通过 ID 引用，不做跨库外键。商家端所有读写只使用会话/JWT 中的 `merchantId`，不信任请求体或查询参数。
- `core-api` 响应统一为 `{ "data": ... }`、`{ "data": [...], "meta": { "page", "pageSize", "total" } }` 或 `{ "error": { "code", "message", "details" } }`。
- 分页参数：`page` 默认 1，`pageSize` 默认 20，最大 100。
- 运营端错误码（本轮新增）：`INVALID_REQUEST`、`UNAUTHORIZED`、`FORBIDDEN`、`CATEGORY_NOT_FOUND`、`CATEGORY_LEVEL_LIMIT`、`CATEGORY_HAS_CHILDREN`、`CATEGORY_IN_USE`、`BRAND_NOT_FOUND`、`BRAND_EXISTS`、`MERCHANT_NOT_FOUND`、`SHOP_NOT_FOUND`、`UPLOAD_INVALID_FILE`、`UPLOAD_TOO_LARGE`、`UPLOAD_UNSUPPORTED_TYPE`。
- 上传：允许 `image/png`、`image/jpeg`、`image/webp`；默认上限 10MB（`UPLOAD_MAX_BYTES` 可覆盖）；文件名使用 `crypto.randomUUID()` + 由 MIME 推导的扩展名，绝不使用用户文件名；存储目录 `UPLOAD_DIR` 默认 `var/uploads`；公开 URL 前缀 `CORE_PUBLIC_URL` 默认 `http://localhost:4000`。
- 商家端只读类目/品牌；运营端不提供商品写能力，本轮不实现任何商品接口。
- 页面只从 `@/components/ui`（商家端）或 `@mtm/ui`（运营端）导入；antd 只能出现在封装层内部。
- 每个任务结束必须提交；提交信息使用 Conventional Commits。
- 全量验证命令：`bun run typecheck && bun run lint && bun run fmt:check && PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="我同意重置本地开发和测试数据库" bun run test`。

## Review Focus

- 空类目树或没有子节点的类目：页面显示空状态、仍可创建一级类目，不崩溃。
- 品牌重名、删除仍有子类目或商品的类目：返回 409 + 稳定错误码，不是 500。
- 上传缺少 `file` 字段、MIME 不受支持、超过上限、文件名含路径穿越：请求被拒绝，落盘文件名与用户输入无关。
- 无 `platform:cross-tenant` 的运营账号查询授权范围外的商家/店铺，或商家访问他人店铺：列表被过滤，详情返回 403/404，不泄露数据。
- 商家账号的 `merchantId` 在 `commerce_core` 中没有对应商家：接口返回 404/空结果，绝不回退到其他商家。

---

### Task 1: `packages/contracts` API 契约与演示身份常量

**Files:**

- Create: `packages/contracts/src/api/common.ts`
- Create: `packages/contracts/src/api/category.ts`
- Create: `packages/contracts/src/api/brand.ts`
- Create: `packages/contracts/src/api/merchant.ts`
- Create: `packages/contracts/src/api/upload.ts`
- Create: `packages/contracts/src/demo.ts`
- Modify: `packages/contracts/src/index.ts`
- Test: `packages/contracts/tests/api-schemas.test.ts`

**Interfaces:**

- Produces:
  - `idSchema: z.ZodString`（`^[A-Za-z0-9_-]{1,64}$`）
  - `apiErrorSchema`、`paginationQuerySchema`、`pageMetaSchema`、`pageSchema(itemSchema)`
  - `categoryStatusSchema`、`attributeTypeSchema`
  - `categoryAttributeInputSchema`、`categoryCreateSchema`、`categoryUpdateSchema`、`categoryNodeSchema`
  - `brandStatusSchema`、`brandCreateSchema`、`brandUpdateSchema`、`brandQuerySchema`、`brandSchema`
  - `merchantStatusSchema`、`shopStatusSchema`、`merchantUpdateSchema`、`shopUpdateSchema`、`merchantQuerySchema`、`shopQuerySchema`、`merchantSchema`、`shopSchema`、`merchantDetailSchema`
  - `uploadResultSchema`、`UPLOAD_ALLOWED_MIME_TYPES`、`UPLOAD_MAX_BYTES`
  - `DEMO_MERCHANT_ID = 'merchant-demo-1'`
  - 对应 `z.infer` 类型：`CategoryNodeDTO`、`CategoryCreateInput`、`CategoryUpdateInput`、`BrandDTO`、`BrandCreateInput`、`BrandUpdateInput`、`MerchantDTO`、`ShopDTO`、`MerchantDetailDTO`、`MerchantUpdateInput`、`ShopUpdateInput`、`UploadResult`。

- [ ] **Step 1: 写失败测试**

`tests/api-schemas.test.ts` 至少覆盖：

```ts
import { brandCreateSchema, categoryCreateSchema, merchantUpdateSchema, paginationQuerySchema } from '../src';

test('分页参数默认 1 / 20 并把字符串转成数字', () => {
  expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  expect(paginationQuerySchema.parse({ page: '2', pageSize: '50' })).toEqual({ page: 2, pageSize: 50 });
  expect(paginationQuerySchema.safeParse({ pageSize: '101' }).success).toBe(false);
});

test('类目 SELECT 属性必须提供非空选项', () => {
  expect(categoryCreateSchema.safeParse({ name: '家具' }).success).toBe(true);
  expect(
    categoryCreateSchema.safeParse({
      name: '沙发',
      attributes: [{ name: '材质', type: 'SELECT', options: [] }],
    }).success
  ).toBe(false);
});

test('品牌名称去空格并拒绝空名', () => {
  expect(brandCreateSchema.parse({ name: ' 青禾 ' }).name).toBe('青禾');
  expect(brandCreateSchema.safeParse({ name: '   ' }).success).toBe(false);
});

test('商家自维护输入会剥掉 tenant 字段', () => {
  expect(merchantUpdateSchema.parse({ name: '新名称', merchantId: 'evil' })).toEqual({ name: '新名称' });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/contracts && bun --bun x vitest run tests/api-schemas.test.ts`
Expected: FAIL，模块导出不存在。

- [ ] **Step 3: 实现契约**

- `categoryCreateSchema` 字段：`parentId`（`idSchema.nullable().optional()`）、`name`（trim + 1..50）、`sort`（int ≥ 0，默认 0）、`status`（默认 `ACTIVE`）、`attributes`（数组，默认 `[]`）。不接收 `level` / `path`，由服务端计算。
- `categoryAttributeInputSchema`：`name` 1..50、`type` 枚举、`required` 默认 false、`options` 默认 `[]`、`sort` 默认 0；`superRefine` 要求 `SELECT` 至少一个非空选项。
- `categoryUpdateSchema`：`name`、`sort`、`status`、`attributes` 全部 optional；不包含 `parentId`。
- `categoryNodeSchema` 是**扁平节点**（`id,parentId,name,level,path,sort,status,attributes`），不是递归树；`/categories/tree` 返回按 `level,path,sort` 排好序的扁平数组，门户按 `level` 缩进展示。
- `brandCreateSchema`：`name` trim 1..50、`logoUrl` 1..1000 的字符串或 null/undefined、`status` 默认 `ACTIVE`。`brandUpdateSchema` 为 partial。
- `merchantUpdateSchema`：`name`、`contactName`、`contactPhone` 可选；`shopUpdateSchema`：`name`、`logoUrl`、`description`、`externalLink`、`address`、`contactName`、`contactPhone` 可选。两个 schema 都不包含 `id` / `merchantId`，Zod 默认会剥掉未知字段。
- `uploadResultSchema`：`{ id: string, url: string }`；`UPLOAD_ALLOWED_MIME_TYPES = ['image/png','image/jpeg','image/webp'] as const`；`UPLOAD_MAX_BYTES = 10 * 1024 * 1024`。
- 从 `src/index.ts` 导出全部新模块。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd packages/contracts && bun --bun x vitest run tests/api-schemas.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add packages/contracts/src packages/contracts/tests/api-schemas.test.ts
git commit -m "feat(contracts): 定义类目品牌商家与上传 API 契约"
```

---

### Task 2: `core-api` HTTP 基座（OpenAPI、错误包络、分页、权限辅助）

**Files:**

- Create: `apps/core-api/src/http.ts`
- Create: `apps/core-api/tests/helpers.ts`
- Modify: `apps/core-api/src/app.ts`
- Modify: `apps/core-api/src/auth.ts`
- Test: `apps/core-api/tests/http.test.ts`

**Interfaces:**

- Produces:
  - `export class HttpError extends Error { code; status; details? }`
  - `export function errorBody(code, message, details?): { error: { code, message, details } }`
  - `export function sendData(c, data, status = 200)`
  - `export function sendPage(c, items, meta)`
  - `export function normalizePage(query: { page?: number; pageSize?: number }): { page; pageSize; skip; take }`
  - `export function requireOpsPermission(code: string): MiddlewareHandler<AppEnv>`
  - `export function requireMerchantPermission(code: string): MiddlewareHandler<AppEnv>`
  - `export function requireAnyPermission(codes: readonly string[]): MiddlewareHandler<AppEnv>`
  - `export function assertMerchantVisible(auth: ServiceTokenClaims, merchantId: string): void`
  - `export function canAccessMerchant(auth: ServiceTokenClaims, merchantId: string): boolean`
  - `export type AppEnv = { Variables: AuthVariables }`
  - `tests/helpers.ts`: `opsToken(permissions, merchantScope = null)`、`merchantToken(merchantId, permissions)`、`resetCoreFixtures()`

- [ ] **Step 1: 写失败测试**

`tests/http.test.ts`：

```ts
import { createApp } from '@/src/app';

test('未知路由之外的校验失败返回统一错误包络', async () => {
  const app = createApp();
  const res = await app.request('/api/v1/me', { headers: { authorization: 'Bearer bad' } });
  expect(res.status).toBe(401);
  expect(await res.json()).toEqual({ error: { code: 'UNAUTHORIZED', message: '未授权', details: null } });
});

test('导出 OpenAPI 文档且包含服务鉴权方案', async () => {
  const res = await createApp().request('/openapi.json');
  expect(res.status).toBe(200);
  const doc = await res.json();
  expect(doc.paths['/api/v1/me']).toBeTruthy();
  expect(doc.components.securitySchemes.bearerAuth).toMatchObject({ type: 'http', scheme: 'bearer' });
});

test('分页默认值与上限', () => {
  expect(normalizePage({})).toEqual({ page: 1, pageSize: 20, skip: 0, take: 20 });
  expect(normalizePage({ page: 3, pageSize: 500 })).toEqual({ page: 3, pageSize: 100, skip: 200, take: 100 });
});
```

同时扩展 `tests/auth.test.ts`：用临时 Hono 路由验证 `requireOpsPermission('category:manage')` 对商家 JWT 返回 403、对运营 JWT 缺少权限返回 403、拥有权限返回 200。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/core-api && bun run test -- tests/http.test.ts tests/auth.test.ts`
Expected: FAIL，`createApp` 不是 `OpenAPIHono`、`/openapi.json` 404。

- [ ] **Step 3: 实现基座**

- `src/app.ts` 改为 `new OpenAPIHono<AppEnv>({ defaultHook })`；`defaultHook` 在参数校验失败时返回 `400` + `INVALID_REQUEST` 包络。
- 注册 `bearerAuth` security scheme；在挂载 `/api/v1/*` 鉴权前注册 `app.doc('/openapi.json', { openapi: '3.1.0', info: { title: 'mtm core-api', version: '0.1.0' } })`。
- `app.onError`：`HttpError` → 对应状态与包络；其他错误 → `500 INTERNAL_ERROR`，响应体不包含堆栈。
- `requireServiceToken` 保持不变；新增的权限辅助在内部同时校验 `auth.portal`。
- `assertMerchantVisible`：拥有 `platform:cross-tenant` 或 `merchantScope === null` 时放行；否则仅当 `merchantScope` 包含目标 ID 时放行，否则抛 `HttpError('FORBIDDEN', 403, '无权访问该商家')`。
- `tests/helpers.ts` 顶部设置 `process.env.CORE_API_JWT_SECRET ||= 'test-core-secret'`；`resetCoreFixtures()` 按 `categoryAttribute → category → shop → merchant → brand → mediaAsset` 顺序 `deleteMany`，供后续测试文件恢复干净夹具。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd apps/core-api && bun run test -- tests/http.test.ts tests/auth.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/core-api/src/http.ts apps/core-api/src/app.ts apps/core-api/src/auth.ts apps/core-api/tests
git commit -m "feat(core-api): 建立 OpenAPI、错误包络与权限辅助基座"
```

---

### Task 3: `commerce_core` 种子数据与商家 ID 对齐

**Files:**

- Create: `apps/core-api/prisma/seed-data.ts`
- Modify: `apps/core-api/prisma/seed.ts`
- Modify: `apps/merchant-admin/lib/db/seed/ids.ts`
- Modify: `apps/merchant-admin/tests/lib/db/auth-seed.test.ts`
- Test: `apps/core-api/tests/seed.test.ts`

**Interfaces:**

- Consumes: `DEMO_MERCHANT_ID` from `@mtm/contracts`。
- Produces:
  - `CORE_DATA_SEED_VERSION = '2026-11-04-core-catalog'`
  - `seedCoreData(client: PrismaClient): Promise<void>`（可重复执行）
  - 固定种子 ID：`merchant-demo-1/2/3`、`shop-demo-1/2/3/4`、`category-demo-*`、`brand-demo-*`

- [ ] **Step 1: 写失败测试**

`tests/seed.test.ts`：

```ts
import { beforeEach, expect, test } from 'vitest';

import { seedCoreData, CORE_DATA_SEED_VERSION } from '@/prisma/seed-data';
import { prisma } from '@/src/db';

import { resetCoreFixtures } from './helpers';

beforeEach(resetCoreFixtures);

test('种子数据可重复执行且数量稳定', async () => {
  await seedCoreData(prisma);
  await seedCoreData(prisma);

  expect(await prisma.merchant.count()).toBe(3);
  expect(await prisma.shop.count()).toBe(4);
  expect(await prisma.category.count()).toBe(23);
  expect(await prisma.brand.count()).toBe(10);
  expect(await prisma.seedMeta.count({ where: { version: CORE_DATA_SEED_VERSION } })).toBe(1);

  const merchant = await prisma.merchant.findUniqueOrThrow({ where: { id: 'merchant-demo-1' } });
  expect(merchant.code).toBe('M1001');
  expect(merchant.shops).toHaveLength(2);
});

test('类目最多三级且路径由 ID 组成', async () => {
  await seedCoreData(prisma);
  const levels = await prisma.category.groupBy({ by: ['level'], _count: true });
  expect(levels.map(item => item.level).sort()).toEqual([1, 2, 3]);
  const leaf = await prisma.category.findFirstOrThrow({ where: { level: 3 } });
  expect(leaf.path.startsWith('/')).toBe(true);
});
```

在 `apps/merchant-admin/tests/lib/db/auth-seed.test.ts` 增加：

```ts
expect(owner.merchantId).toBe('merchant-demo-1');
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/core-api && bun run test -- tests/seed.test.ts`
Expected: FAIL，`seed-data` 不存在。

- [ ] **Step 3: 实现种子**

- `seed-data.ts` 使用 upsert 写入 3 个虚构商家、4 个店铺、23 个三级类目、10 个虚构品牌；商家 `merchant-demo-1` 的 ID 必须等于 `DEMO_MERCHANT_ID`。示例：
  - 商家：`merchant-demo-1`（青禾家居有限公司）、`merchant-demo-2`（星河数码有限公司）、`merchant-demo-3`（云岭食品有限公司）。
  - 店铺：青禾家居旗舰店、青禾生活馆、星河数码专营店、云岭食品旗舰店。
  - 一级类目：家居生活、数码电器、食品饮料、服饰鞋包；每类两到三个二级、每个二级两到三个三级。
  - 品牌：青禾、星河、云岭、简木、微光、拾光、蓝屿、原野、知味、驰川。
- 类目路径规则：`path = parent ? `${parent.path}/${id}`:`/${id}``，`level = parent ? parent.level + 1 : 1`。
- 为至少两个三级类目写入属性：沙发（材质 SELECT、尺寸 TEXT）、智能手机（屏幕尺寸 NUMBER、颜色 SELECT）。
- `prisma/seed.ts` 保留原有 `SeedMeta('bootstrap')`，再调用 `seedCoreData(prisma)`。
- `apps/merchant-admin/lib/db/seed/ids.ts` 改为 `export const SEED_MERCHANT_ID = DEMO_MERCHANT_ID;`，从 `@mtm/contracts` 导入。提醒执行者：本地开发库需 `bun run db:reset` 才能清掉旧 `'1'` 租户行。

- [ ] **Step 4: 运行测试确认通过**

Run:

```bash
cd apps/core-api && bun run test -- tests/seed.test.ts
cd ../merchant-admin && bun run test -- tests/lib/db/auth-seed.test.ts
```

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/core-api/prisma apps/core-api/tests/seed.test.ts apps/merchant-admin/lib/db/seed/ids.ts apps/merchant-admin/tests/lib/db/auth-seed.test.ts
git commit -m "feat(seed): 增加 commerce_core 演示类目品牌与商家数据"
```

---

### Task 4: 类目 API（查询树、新增、修改、删除）

**Files:**

- Create: `apps/core-api/src/services/categories.ts`
- Create: `apps/core-api/src/routes/categories.ts`
- Modify: `apps/core-api/src/app.ts`
- Test: `apps/core-api/tests/categories.test.ts`

**Interfaces:**

- Consumes: `categoryCreateSchema`、`categoryUpdateSchema`、`categoryNodeSchema`、`idSchema`、`PERMISSIONS`。
- Produces:
  - `GET /api/v1/categories/tree` → `{ data: CategoryNodeDTO[] }`
  - `POST /api/v1/categories` → `{ data: CategoryNodeDTO }`
  - `PATCH /api/v1/categories/:id` → `{ data: CategoryNodeDTO }`
  - `DELETE /api/v1/categories/:id` → `{ data: null }`
  - `registerCategoryRoutes(app: OpenAPIHono<AppEnv>): void`

- [ ] **Step 1: 写失败测试**

`tests/categories.test.ts`（`beforeEach` 先 `resetCoreFixtures()` 再 `seedCoreData`）：

```ts
test('运营端按 category:view 读取扁平类目树', async () => {
  const res = await get('/api/v1/categories/tree', opsToken(['category:view']));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.data.length).toBe(23);
  expect(body.data[0]).toMatchObject({ level: 1, parentId: null });
  expect(body.data.some((node: { level: number }) => node.level === 3)).toBe(true);
});

test('商家拥有商品权限时可只读类目，但没有管理权限', async () => {
  expect((await get('/api/v1/categories/tree', merchantToken(DEMO_MERCHANT_ID, ['product:view']))).status).toBe(200);
  expect(
    (
      await request(
        '/api/v1/categories',
        'POST',
        { name: '新类目' },
        merchantToken(DEMO_MERCHANT_ID, ['product:update'])
      )
    ).status
  ).toBe(403);
});

test('创建二级类目自动计算 level 与 path，超过三级被拒绝', async () => {
  const parent = await prisma.category.findFirstOrThrow({ where: { level: 1 } });
  const created = await request(
    '/api/v1/categories',
    'POST',
    { parentId: parent.id, name: '新二级' },
    opsToken(['category:manage'])
  );
  expect(created.status).toBe(200);
  const node = (await created.json()).data;
  expect(node.level).toBe(2);
  expect(node.path.startsWith(`${parent.path}/`)).toBe(true);

  const leaf = await prisma.category.findFirstOrThrow({ where: { level: 3 } });
  const tooDeep = await request(
    '/api/v1/categories',
    'POST',
    { parentId: leaf.id, name: '第四级' },
    opsToken(['category:manage'])
  );
  expect(tooDeep.status).toBe(400);
  expect(await tooDeep.json()).toMatchObject({ error: { code: 'CATEGORY_LEVEL_LIMIT' } });
});

test('删除有子类目的类目返回 409，删除叶子成功', async () => {
  const parent = await prisma.category.findFirstOrThrow({ where: { level: 1 } });
  const blocked = await request(`/api/v1/categories/${parent.id}`, 'DELETE', undefined, opsToken(['category:manage']));
  expect(blocked.status).toBe(409);
  expect(await blocked.json()).toMatchObject({ error: { code: 'CATEGORY_HAS_CHILDREN' } });

  const leaf = await prisma.category.findFirstOrThrow({ where: { level: 3, children: { none: {} } } });
  expect(
    (await request(`/api/v1/categories/${leaf.id}`, 'DELETE', undefined, opsToken(['category:manage']))).status
  ).toBe(200);
  expect(await prisma.category.findUnique({ where: { id: leaf.id } })).toBeNull();
});

test('修改类目名称/状态/属性', async () => {
  const leaf = await prisma.category.findFirstOrThrow({ where: { level: 3 } });
  const res = await request(
    `/api/v1/categories/${leaf.id}`,
    'PATCH',
    { name: '改名类目', status: 'DISABLED', attributes: [{ name: '颜色', type: 'TEXT' }] },
    opsToken(['category:manage'])
  );
  expect(res.status).toBe(200);
  const node = (await res.json()).data;
  expect(node.name).toBe('改名类目');
  expect(node.status).toBe('DISABLED');
  expect(node.attributes).toHaveLength(1);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/core-api && bun run test -- tests/categories.test.ts`
Expected: FAIL，路由 404。

- [ ] **Step 3: 实现**

- `src/services/categories.ts`：`listCategoryNodes`、`createCategory`、`updateCategory`、`deleteCategory`。查询按 `[{ level: 'asc' }, { path: 'asc' }, { sort: 'asc' }]` 排序；属性按 `sort` 排序。
- 创建：父类目不存在 → `CATEGORY_NOT_FOUND` 404；父 `level >= 3` → `CATEGORY_LEVEL_LIMIT` 400；先创建（Prisma 生成 cuid），再用返回 ID 计算 `path` 并 update。
- 修改：只允许 name/sort/status/attributes；属性使用事务内 `deleteMany` + `createMany` 整体替换。
- 删除：存在子类目 → 409 `CATEGORY_HAS_CHILDREN`；`prisma.product.count({ where: { categoryId: id } }) > 0` → 409 `CATEGORY_IN_USE`；否则事务内删除属性与类目。
- 权限：GET 允许运营 `category:view` 或商家 `product:view/product:create/product:update`；写操作仅运营 `category:manage`。
- `src/routes/categories.ts` 使用 `createRoute`/`app.openapi` 注册，响应 schema 来自 contracts；`registerCategoryRoutes` 在 `createApp` 中调用。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd apps/core-api && bun run test -- tests/categories.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/core-api/src/services/categories.ts apps/core-api/src/routes/categories.ts apps/core-api/src/app.ts apps/core-api/tests/categories.test.ts
git commit -m "feat(core-api): 实现类目树查询与管理接口"
```

---

### Task 5: 品牌 API

**Files:**

- Create: `apps/core-api/src/services/brands.ts`
- Create: `apps/core-api/src/routes/brands.ts`
- Modify: `apps/core-api/src/app.ts`
- Test: `apps/core-api/tests/brands.test.ts`

**Interfaces:**

- Produces:
  - `GET /api/v1/brands?page=&pageSize=&keyword=&status=` → `{ data: BrandDTO[], meta }`
  - `POST /api/v1/brands` → `{ data: BrandDTO }`
  - `PATCH /api/v1/brands/:id` → `{ data: BrandDTO }`
  - `registerBrandRoutes(app: OpenAPIHono<AppEnv>): void`

- [ ] **Step 1: 写失败测试**

`tests/brands.test.ts`（同 Task 4 的夹具初始化）：

```ts
test('运营端分页查询品牌并按关键字过滤', async () => {
  const res = await get('/api/v1/brands?page=1&pageSize=5&keyword=青', opsToken(['brand:manage']));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.meta).toMatchObject({ page: 1, pageSize: 5 });
  expect(body.data.every((brand: { name: string }) => brand.name.includes('青'))).toBe(true);
});

test('商家只能读取品牌', async () => {
  expect((await get('/api/v1/brands', merchantToken(DEMO_MERCHANT_ID, ['product:view']))).status).toBe(200);
  expect(
    (await request('/api/v1/brands', 'POST', { name: '新品牌' }, merchantToken(DEMO_MERCHANT_ID, ['product:update'])))
      .status
  ).toBe(403);
});

test('重名品牌返回 409 而不是 500', async () => {
  const res = await request('/api/v1/brands', 'POST', { name: '青禾' }, opsToken(['brand:manage']));
  expect(res.status).toBe(409);
  expect(await res.json()).toMatchObject({ error: { code: 'BRAND_EXISTS' } });
});

test('修改品牌名称与状态', async () => {
  const brand = await prisma.brand.findFirstOrThrow();
  const res = await request(
    `/api/v1/brands/${brand.id}`,
    'PATCH',
    { name: '改名品牌', status: 'DISABLED' },
    opsToken(['brand:manage'])
  );
  expect(res.status).toBe(200);
  expect((await res.json()).data).toMatchObject({ name: '改名品牌', status: 'DISABLED' });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/core-api && bun run test -- tests/brands.test.ts`
Expected: FAIL，路由 404。

- [ ] **Step 3: 实现**

- `listBrands`：`where` 组合 `keyword`（name `contains`, `mode: 'insensitive'`）与 `status`，`orderBy: { name: 'asc' }`，`skip/take` 来自 `normalizePage`。
- `createBrand` / `updateBrand`：捕获 Prisma `P2002` 唯一约束 → `BRAND_EXISTS` 409；找不存在的品牌 → `BRAND_NOT_FOUND` 404。
- 权限：GET 允许运营 `brand:manage` 或商家商品读权限；POST/PATCH 仅运营 `brand:manage`。
- 注册路由并在 `createApp` 中调用。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd apps/core-api && bun run test -- tests/brands.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/core-api/src/services/brands.ts apps/core-api/src/routes/brands.ts apps/core-api/src/app.ts apps/core-api/tests/brands.test.ts
git commit -m "feat(core-api): 实现品牌查询与管理接口"
```

---

### Task 6: 商家 / 店铺查询与商家自维护 API

**Files:**

- Create: `apps/core-api/src/services/merchants.ts`
- Create: `apps/core-api/src/routes/merchants.ts`
- Modify: `apps/core-api/src/app.ts`
- Test: `apps/core-api/tests/merchants.test.ts`

**Interfaces:**

- Consumes: `assertMerchantVisible`、`merchantQuerySchema`、`shopQuerySchema`、`merchantUpdateSchema`、`shopUpdateSchema`。
- Produces:
  - `GET /api/v1/merchants`（运营 `merchant:view`，按范围过滤）
  - `GET /api/v1/merchants/me`（商家，返回 `MerchantDetailDTO`）
  - `GET /api/v1/merchants/:id`（运营 `merchant:view`，含 shops）
  - `PATCH /api/v1/merchants/me`（商家 `merchant:update`）
  - `GET /api/v1/shops`（运营 `shop:view`，按商家范围过滤）
  - `GET /api/v1/shops/:id`（运营 `shop:view`）
  - `PATCH /api/v1/shops/:id`（商家 `shop:update`，仅自己的店铺）
  - `registerMerchantRoutes(app: OpenAPIHono<AppEnv>): void`

- [ ] **Step 1: 写失败测试**

`tests/merchants.test.ts`：

```ts
test('无 cross-tenant 的运营账号只看到授权商家', async () => {
  const scoped = await get('/api/v1/merchants', opsToken(['merchant:view'], ['merchant-demo-2']));
  const body = await scoped.json();
  expect(body.data.map((item: { id: string }) => item.id)).toEqual(['merchant-demo-2']);

  const cross = await get('/api/v1/merchants', opsToken(['merchant:view', 'platform:cross-tenant'], null));
  expect((await cross.json()).data).toHaveLength(3);
});

test('访问范围外商家详情返回 403', async () => {
  const res = await get('/api/v1/merchants/merchant-demo-3', opsToken(['merchant:view'], ['merchant-demo-2']));
  expect(res.status).toBe(403);
});

test('商家读取自己的商家与店铺，但不能读取他人店铺', async () => {
  const mine = await get('/api/v1/merchants/me', merchantToken('merchant-demo-1', ['merchant:update']));
  expect(mine.status).toBe(200);
  const detail = (await mine.json()).data;
  expect(detail.id).toBe('merchant-demo-1');
  expect(detail.shops).toHaveLength(2);

  const other = await request(
    '/api/v1/shops/shop-demo-3',
    'PATCH',
    { description: '越权修改' },
    merchantToken('merchant-demo-1', ['shop:update'])
  );
  expect(other.status).toBe(403);
});

test('商家只能更新自己的基础资料，tenant 字段被忽略', async () => {
  const res = await request(
    '/api/v1/merchants/me',
    'PATCH',
    { name: '新商家名', merchantId: 'merchant-demo-2' },
    merchantToken('merchant-demo-1', ['merchant:update'])
  );
  expect(res.status).toBe(200);
  expect((await res.json()).data.name).toBe('新商家名');
  expect((await prisma.merchant.findUniqueOrThrow({ where: { id: 'merchant-demo-1' } })).name).toBe('新商家名');
  expect((await prisma.merchant.findUniqueOrThrow({ where: { id: 'merchant-demo-2' } })).name).not.toBe('新商家名');
});

test('商家 tenant 在 core 中不存在时返回 404', async () => {
  const res = await get('/api/v1/merchants/me', merchantToken('missing-merchant', ['merchant:update']));
  expect(res.status).toBe(404);
  expect(await res.json()).toMatchObject({ error: { code: 'MERCHANT_NOT_FOUND' } });
});

test('店铺列表按运营范围过滤并可分页', async () => {
  const res = await get('/api/v1/shops?page=1&pageSize=10', opsToken(['shop:view'], ['merchant-demo-1']));
  const body = await res.json();
  expect(body.data.every((shop: { merchantId: string }) => shop.merchantId === 'merchant-demo-1')).toBe(true);
  expect(body.meta.total).toBe(2);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/core-api && bun run test -- tests/merchants.test.ts`
Expected: FAIL，路由 404。

- [ ] **Step 3: 实现**

- 路由注册顺序：`/merchants/me` 必须在 `/merchants/:id` 之前。
- 运营列表：`visibleMerchantWhere(auth)` 返回 `{}`（cross-tenant）或 `{ id: { in: auth.merchantScope ?? [] } }`；商家列表以该 where 过滤，店铺列表用 `merchantId: { in: 可见商家ID }`。没有可见商家时返回空页，而不是全量。
- `GET /merchants/:id`：先查存在（404 `MERCHANT_NOT_FOUND`），再 `assertMerchantVisible`（403）。
- `GET /merchants/me`：`auth.portal === 'merchant'` 且 `auth.merchantId` 非空；查不到 → 404。
- `PATCH /merchants/me`：只更新 `merchantUpdateSchema` 字段，始终 `where: { id: auth.merchantId }`。
- `GET /shops/:id`：运营 `shop:view`，查出后 `assertMerchantVisible(auth, shop.merchantId)`。
- `PATCH /shops/:id`：商家 `shop:update`；店铺不存在 → 404；`shop.merchantId !== auth.merchantId` → 403。
- DTO 日期转 ISO 字符串；`merchantDetailSchema` 包含 `shops`。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd apps/core-api && bun run test -- tests/merchants.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/core-api/src/services/merchants.ts apps/core-api/src/routes/merchants.ts apps/core-api/src/app.ts apps/core-api/tests/merchants.test.ts
git commit -m "feat(core-api): 实现商家店铺查询与商家自维护接口"
```

---

### Task 7: 图片上传、静态访问与门户 BFF 的 multipart 转发

**Files:**

- Create: `apps/core-api/src/services/uploads.ts`
- Create: `apps/core-api/src/routes/uploads.ts`
- Modify: `apps/core-api/src/app.ts`
- Modify: `apps/ops-admin/lib/core-api.ts`
- Modify: `apps/merchant-admin/lib/core-api.ts`
- Modify: `apps/ops-admin/tests/lib/core-api.test.ts`
- Modify: `apps/merchant-admin/tests/lib/core-api.test.ts`
- Modify: `.env.example`
- Modify: `turbo.json`
- Modify: `.gitignore`
- Test: `apps/core-api/tests/uploads.test.ts`

**Interfaces:**

- Consumes: `UPLOAD_ALLOWED_MIME_TYPES`、`UPLOAD_MAX_BYTES`、`uploadResultSchema`。
- Produces:
  - `POST /api/v1/uploads/images`（multipart，字段名 `file`）→ `{ data: { id, url } }`
  - `GET /uploads/:filename`（公开静态图片）
  - 两边门户的 `callCoreApi(path, { formData })` 与 `proxyToCoreApi` 的 multipart 分支。

- [ ] **Step 1: 写失败测试**

`apps/core-api/tests/uploads.test.ts`（在 `createApp` 之前设置 `UPLOAD_DIR` 为临时目录、`UPLOAD_MAX_BYTES='1024'`、`CORE_PUBLIC_URL='http://core.test'`）：

```ts
test('运营端上传 PNG 成功并可通过 /uploads 读取', async () => {
  const form = new FormData();
  form.append('file', new File([new Uint8Array([1, 2, 3])], 'x.png', { type: 'image/png' }));
  const res = await app.request('/api/v1/uploads/images', {
    method: 'POST',
    headers: { authorization: `Bearer ${opsToken(['brand:manage'])}` },
    body: form,
  });
  expect(res.status).toBe(200);
  const { data } = await res.json();
  expect(data.url).toMatch(/^http:\/\/core\.test\/uploads\/[0-9a-f-]+\.png$/);
  expect(await prisma.mediaAsset.count({ where: { id: data.id, merchantId: null } })).toBe(1);

  const file = await app.request(new URL(data.url).pathname);
  expect(file.status).toBe(200);
  expect(file.headers.get('content-type')).toContain('image/png');
});

test('商家上传记录自己的 merchantId', async () => {
  const form = new FormData();
  form.append('file', new File([new Uint8Array([1, 2, 3])], 'x.webp', { type: 'image/webp' }));
  const res = await app.request('/api/v1/uploads/images', {
    method: 'POST',
    headers: { authorization: `Bearer ${merchantToken(DEMO_MERCHANT_ID, ['product:update'])}` },
    body: form,
  });
  const { data } = await res.json();
  expect((await prisma.mediaAsset.findUniqueOrThrow({ where: { id: data.id } })).merchantId).toBe(DEMO_MERCHANT_ID);
});

test('缺少文件、非法类型、超限与路径穿越被拒绝', async () => {
  expect((await upload(new FormData(), ['brand:manage'])).status).toBe(400);
  expect((await upload(fileForm('a.txt', 'text/plain', 3), ['brand:manage'])).status).toBe(400);
  expect((await upload(fileForm('big.png', 'image/png', 2048), ['brand:manage'])).status).toBe(400);
  expect((await app.request('/uploads/..%2Fsecret.txt')).status).toBe(404);
});

test('没有上传权限的商家返回 403', async () => {
  expect((await upload(fileForm('x.png', 'image/png', 3), ['product:view'])).status).toBe(403);
});
```

门户测试各新增一条：

```ts
test('multipart 请求以 FormData 转发且不设置 JSON content-type', async () => {
  fetchMock.mockResolvedValue(jsonResponse(200, { data: { id: 'm1', url: '/uploads/x.png' } }));
  const form = new FormData();
  form.append('file', new File(['x'], 'x.png', { type: 'image/png' }));

  const response = await proxyToCoreApi(
    new Request('http://localhost/api/bff/uploads/images', {
      method: 'POST',
      headers: { 'sec-fetch-site': 'same-origin' },
      body: form,
    }),
    ['uploads', 'images']
  );

  expect(response.status).toBe(200);
  expect(fetchMock.mock.calls[0][1].body).toBeInstanceOf(FormData);
  expect(fetchMock.mock.calls[0][1].headers['content-type']).toBeUndefined();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
cd apps/core-api && bun run test -- tests/uploads.test.ts
cd ../ops-admin && bun run test -- tests/lib/core-api.test.ts
cd ../merchant-admin && bun run test -- tests/lib/core-api.test.ts
```

Expected: FAIL，上传路由不存在、multipart 被当作 JSON 解析。

- [ ] **Step 3: 实现**

- `resolveUploadConfig()` 读取 `UPLOAD_DIR`、`UPLOAD_MAX_BYTES`、`CORE_PUBLIC_URL`，非法数字回退默认值；`createApp` 调用一次并传给上传路由与 `serveStatic`。
- `POST /api/v1/uploads/images`：手动 `await c.req.formData()`；`file` 必须是 `File` 且 `size > 0`；MIME 不在允许列表 → 400 `UPLOAD_UNSUPPORTED_TYPE`；`size > max` → 400 `UPLOAD_TOO_LARGE`。权限：运营需 `brand:manage` 或 `category:manage`；商家需 `product:update` 或 `shop:update`。落盘文件名 `randomUUID() + ext`，`mkdir` 后 `writeFile`；写 `MediaAsset`，运营 `merchantId = null`，商家为 JWT 的 `merchantId`。返回绝对 `url`。
- 静态：`app.use('/uploads/*', serveStatic({ root: config.dir, rewriteRequestPath: path => path.replace(/^\/uploads/, '') }))`，放在 `/api/v1/*` 鉴权之外。
- 门户 `lib/core-api.ts`：`CoreApiInit` 增加 `formData?: FormData`；存在 `formData` 时 fetch 使用它且不设置 `content-type`；`proxyToCoreApi` 在 `content-type` 以 `multipart/form-data` 开头时执行 `await request.formData()` 并走该分支。
- `.env.example` 增加：`CORE_PUBLIC_URL=http://localhost:4000`、`UPLOAD_DIR=var/uploads`、`UPLOAD_MAX_BYTES=10485760`；`turbo.json` 的 `globalEnv` 与 `dev.env` 同步；`.gitignore` 增加 `apps/core-api/var/`。

- [ ] **Step 4: 运行测试确认通过**

Run:

```bash
cd apps/core-api && bun run test -- tests/uploads.test.ts
cd ../ops-admin && bun run test -- tests/lib/core-api.test.ts
cd ../merchant-admin && bun run test -- tests/lib/core-api.test.ts
```

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/core-api/src apps/core-api/tests/uploads.test.ts apps/ops-admin/lib/core-api.ts apps/ops-admin/tests/lib/core-api.test.ts apps/merchant-admin/lib/core-api.ts apps/merchant-admin/tests/lib/core-api.test.ts .env.example turbo.json .gitignore
git commit -m "feat(upload): 实现图片上传静态访问与 BFF multipart 转发"
```

---

### Task 8: 运营端类目管理页面

**Files:**

- Modify: `apps/ops-admin/app/(dashboard)/categories/page.tsx`
- Create: `apps/ops-admin/components/catalog/CategoryManager/index.tsx`
- Create: `apps/ops-admin/components/catalog/CategoryManager/index.module.css`
- Test: `apps/ops-admin/tests/components/CategoryManager.test.tsx`

**Interfaces:**

- Consumes: `GET/POST/PATCH/DELETE /api/bff/categories*`；`CategoryNodeDTO`、`CategoryCreateInput`、`CategoryUpdateInput`；`PERMISSIONS.CATEGORY_MANAGE`。
- Produces: `<CategoryManager />`，挂在 `/categories`。

- [ ] **Step 1: 写失败测试**

使用 `PermissionProvider permissions={[PERMISSIONS.CATEGORY_MANAGE]}` + `ToastProvider` + `QueryClientProvider`，mock `@/lib/api-client`：

```ts
test('空类目树显示空状态并允许创建一级类目', async () => {
  mocks.apiFetch.mockResolvedValue([]);
  renderManager();
  expect(await screen.findByText('暂无类目')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '新建一级类目' })).toBeInTheDocument();
});

test('按层级缩进渲染类目并创建子类目', async () => {
  mocks.apiFetch.mockImplementation((path, init) => {
    if (path === '/api/bff/categories/tree' && (init?.method ?? 'GET') === 'GET') {
      return Promise.resolve([
        {
          id: 'c1',
          parentId: null,
          name: '家居生活',
          level: 1,
          path: '/c1',
          sort: 0,
          status: 'ACTIVE',
          attributes: [],
        },
        { id: 'c2', parentId: 'c1', name: '家具', level: 2, path: '/c1/c2', sort: 0, status: 'ACTIVE', attributes: [] },
      ]);
    }
    if (path === '/api/bff/categories' && init?.method === 'POST') return Promise.resolve({});
    return Promise.resolve([]);
  });
  renderManager();

  expect(await screen.findByText('家居生活')).toBeInTheDocument();
  expect(screen.getByText('家具')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '新建一级类目' }));
  await userEvent.type(screen.getByLabelText('类目名称'), '数码电器');
  await userEvent.click(screen.getByRole('button', { name: '保存' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/bff/categories', {
      method: 'POST',
      body: { name: '数码电器', sort: 0, status: 'ACTIVE' },
    })
  );
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/ops-admin && bun run test -- tests/components/CategoryManager.test.tsx`
Expected: FAIL，组件不存在。

- [ ] **Step 3: 实现**

- 页面保留 `requireOpsPermission(PERMISSIONS.CATEGORY_VIEW)`，渲染 `<CategoryManager />`。
- `useQuery(['ops','categories','tree'])` → `apiFetch<CategoryNodeDTO[]>('/api/bff/categories/tree')`。
- 表格列：名称（按 `level` 增加左内边距）、层级、排序、状态 Tag、属性数、操作（添加子类 / 编辑 / 删除）。无数据时 `emptyText='暂无类目'`。
- 工具栏按钮“新建一级类目”；行内“添加子类”预置 `parentId`。
- 新建/编辑使用 `Dialog` + `Form`，schema 为本地 `z.object({ name: z.string().trim().min(1).max(50), sort: z.coerce.number().int().min(0), status: z.enum(['ACTIVE','DISABLED']) })`；`parentId` 由对话框状态携带，编辑时父类目只读。
- 属性编辑器使用组件内 `useState` 管理草稿数组（名称 / 类型 / 必填 / 逗号分隔选项），提交时映射为 `attributes`；不在 RHF 中注册。
- 删除使用确认 `Dialog`；403/409 用 `toast.error(error.message)`。
- 操作按钮包在 `<Can permission={PERMISSIONS.CATEGORY_MANAGE}>` 内。
- 成功后 `invalidateQueries({ queryKey: ['ops','categories','tree'] })`。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd apps/ops-admin && bun run test -- tests/components/CategoryManager.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/ops-admin/app/'(dashboard)'/categories/page.tsx apps/ops-admin/components/catalog/CategoryManager apps/ops-admin/tests/components/CategoryManager.test.tsx
git commit -m "feat(ops-admin): 实现类目管理页面"
```

---

### Task 9: 运营端品牌管理页面（含图片上传）

**Files:**

- Modify: `apps/ops-admin/app/(dashboard)/brands/page.tsx`
- Create: `apps/ops-admin/components/catalog/BrandManager/index.tsx`
- Create: `apps/ops-admin/components/catalog/BrandManager/index.module.css`
- Create: `apps/ops-admin/components/catalog/BrandLogoField/index.tsx`
- Test: `apps/ops-admin/tests/components/BrandManager.test.tsx`

**Interfaces:**

- Consumes: `GET/POST/PATCH /api/bff/brands`、`POST /api/bff/uploads/images`、`BrandDTO`、`UploadResult`。
- Produces: `<BrandManager />` 挂在 `/brands`。

- [ ] **Step 1: 写失败测试**

```ts
test('渲染品牌列表并创建品牌', async () => {
  renderManager(); // PermissionProvider 含 brand:manage
  expect(await screen.findByText('青禾')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '新建品牌' }));
  await userEvent.type(screen.getByLabelText('品牌名称'), '新品牌');
  await userEvent.click(screen.getByRole('button', { name: '保存' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/bff/brands', {
      method: 'POST',
      body: { name: '新品牌', status: 'ACTIVE', logoUrl: null },
    })
  );
});

test('停用品牌走 PATCH', async () => {
  await userEvent.click(await screen.findByRole('button', { name: '停用' }));
  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/bff/brands/brand-demo-1', {
      method: 'PATCH',
      body: { status: 'DISABLED' },
    })
  );
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/ops-admin && bun run test -- tests/components/BrandManager.test.tsx`
Expected: FAIL，组件不存在。

- [ ] **Step 3: 实现**

- 列表：关键字/状态筛选 + `DataTable` 分页；列：Logo 缩略图（无则占位）、名称、状态、创建操作（编辑 / 启用停用）。
- `BrandLogoField` 使用 `Controller` 绑定 `logoUrl`；内部 `Upload` 选择文件后：
  ```ts
  const formData = new FormData();
  formData.append('file', file);
  const result = await apiFetch<UploadResult>('/api/bff/uploads/images', { method: 'POST', body: formData });
  field.onChange(result.url);
  ```
  上传失败 toast 提示；accept `image/png,image/jpeg,image/webp`。
- 品牌表单 schema：`{ name: z.string().trim().min(1).max(50), status, logoUrl: z.string().nullable() }`；提交空 logo 时发送 `null`。
- 页面保留 `requireOpsPermission(PERMISSIONS.BRAND_MANAGE)`。
- 成功/失败处理与类目页一致，使用 query key `['ops','brands', params]`。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd apps/ops-admin && bun run test -- tests/components/BrandManager.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/ops-admin/app/'(dashboard)'/brands/page.tsx apps/ops-admin/components/catalog/BrandManager apps/ops-admin/components/catalog/BrandLogoField apps/ops-admin/tests/components/BrandManager.test.tsx
git commit -m "feat(ops-admin): 实现品牌管理与图片上传页面"
```

---

### Task 10: 运营端商家列表与详情

**Files:**

- Modify: `apps/ops-admin/app/(dashboard)/merchants/page.tsx`
- Create: `apps/ops-admin/components/catalog/MerchantManager/index.tsx`
- Create: `apps/ops-admin/components/catalog/MerchantManager/index.module.css`
- Test: `apps/ops-admin/tests/components/MerchantManager.test.tsx`

**Interfaces:**

- Consumes: `GET /api/bff/merchants`、`GET /api/bff/merchants/:id`、`MerchantDTO`、`MerchantDetailDTO`。
- Produces: `<MerchantManager />` 挂在 `/merchants`（只读，无新建/删除按钮）。

- [ ] **Step 1: 写失败测试**

```ts
test('渲染商家列表并打开只读详情', async () => {
  renderManager();
  expect(await screen.findByText('青禾家居有限公司')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '查看' }));

  expect(await screen.findByText('青禾家居旗舰店')).toBeInTheDocument();
  expect(screen.getByText('M1001')).toBeInTheDocument();
  expect(screen.getByText('青禾生活馆')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '新建商家' })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/ops-admin && bun run test -- tests/components/MerchantManager.test.tsx`
Expected: FAIL，组件不存在。

- [ ] **Step 3: 实现**

- 列表：关键字（商家编码/名称）、状态筛选、分页；列：编码、名称、联系人、联系电话、状态、店铺数（若 DTO 包含）/操作。
- 详情使用 `Dialog` 或 `Drawer`，`useQuery(['ops','merchants',id])` 拉 `apiFetch<MerchantDetailDTO>(`/api/bff/merchants/${id}`)`；展示商家基础字段与店铺表格（名称、地址、状态、联系电话）。
- 页面保留 `requireOpsPermission(PERMISSIONS.MERCHANT_VIEW)`；不渲染任何写操作。
- 错误（403/404）显示 `Empty description='加载失败'` 或 toast。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd apps/ops-admin && bun run test -- tests/components/MerchantManager.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/ops-admin/app/'(dashboard)'/merchants/page.tsx apps/ops-admin/components/catalog/MerchantManager apps/ops-admin/tests/components/MerchantManager.test.tsx
git commit -m "feat(ops-admin): 实现商家只读列表与详情"
```

---

### Task 11: 商家端店铺资料通过 `core-api` 保存

**Files:**

- Create: `apps/merchant-admin/lib/services/shop-profile.ts`
- Modify: `apps/merchant-admin/components/shop/profile/BaseInfo/index.tsx`
- Test: `apps/merchant-admin/tests/lib/services/shop-profile.test.ts`

**Interfaces:**

- Consumes: `GET /api/bff/merchants/me`、`PATCH /api/bff/shops/:id`；`MerchantDetailDTO`、`ShopDTO`、`ShopUpdateInput`。
- Produces:
  - `fetchMyMerchant(): Promise<MerchantDetailDTO>`
  - `updateMyShop(shopId: string, input: ShopUpdateInput): Promise<ShopDTO>`

- [ ] **Step 1: 写失败测试**

`tests/lib/services/shop-profile.test.ts` mock `@/lib/api-client` 的 `apiFetch`：

```ts
test('读取当前商家的商家与店铺', async () => {
  apiFetchMock.mockResolvedValue({ id: 'merchant-demo-1', shops: [{ id: 'shop-demo-1' }] });
  const result = await fetchMyMerchant();
  expect(apiFetchMock).toHaveBeenCalledWith('/api/bff/merchants/me');
  expect(result.shops[0].id).toBe('shop-demo-1');
});

test('更新店铺资料只发送允许字段', async () => {
  apiFetchMock.mockResolvedValue({ id: 'shop-demo-1' });
  await updateMyShop('shop-demo-1', { description: '新简介', externalLink: 'https://example.com' });
  expect(apiFetchMock).toHaveBeenCalledWith('/api/bff/shops/shop-demo-1', {
    method: 'PATCH',
    body: { description: '新简介', externalLink: 'https://example.com' },
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd apps/merchant-admin && bun run test -- tests/lib/services/shop-profile.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现**

- `lib/services/shop-profile.ts` 只做 `apiFetch` 封装并导出类型。
- `BaseInfo`：
  - 增加 `myMerchantQuery = useQuery({ queryKey: queryKeys.myMerchant, queryFn: fetchMyMerchant })`；`queryKeys` 增加 `myMerchant: ['merchant','me']`（或使用现有 `merchant` key，避免重复）。
  - `shopId = myMerchantQuery.data?.shops[0]?.id`。
  - 表单 `onSubmit` 改为 `await updateMyShop(shopId, values)`，成功 toast `店铺基本信息已更新` 并 `invalidateQueries({ queryKey: queryKeys.myMerchant })`；`shopId` 缺失时 toast 错误。
  - 原有展示继续读取 `/api/merchant/detail`，不改视觉。
- 注意：`baseInfoSchema` 的 `externalLink` 允许空字符串；服务端 schema 接受。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd apps/merchant-admin && bun run test -- tests/lib/services/shop-profile.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add apps/merchant-admin/lib/services/shop-profile.ts apps/merchant-admin/lib/query-keys.ts apps/merchant-admin/components/shop/profile/BaseInfo/index.tsx apps/merchant-admin/tests/lib/services/shop-profile.test.ts
git commit -m "feat(merchant-admin): 店铺资料改由 core-api 保存"
```

---

### Task 12: 文档、环境说明与全量验证

**Files:**

- Modify: `CLAUDE.md`
- Modify: `README.md`（若已有环境/演示账号章节则补充上传目录与端口说明）
- Modify: `.env.example`（确认 Task 7 的三个变量齐全）

**Interfaces:**

- Produces: 阶段 3 完成状态、下一阶段入口、上传配置说明、手工冒烟清单。

- [ ] **Step 1: 更新文档**

- `CLAUDE.md`「当前状态」改为阶段 3 已完成，列出：类目树 CRUD、品牌 CRUD + 上传、商家/店铺只读与商家自维护、图片本地存储。
- 「下一步」改为编写并执行阶段 4（商品/版本/审核）计划。
- 在「现有命令」附近补充：`UPLOAD_DIR`、`UPLOAD_MAX_BYTES`、`CORE_PUBLIC_URL` 的含义；提醒 `apps/core-api/var/` 不提交。
- README 补充演示账号与图片上传说明（若 README 无对应章节）。

- [ ] **Step 2: 全量静态检查**

Run:

```bash
bun run typecheck
bun run lint
bun run fmt:check
```

Expected: 全部通过；仅允许既有 warning。

- [ ] **Step 3: 全量测试**

Run:

```bash
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="我同意重置本地开发和测试数据库" bun run test
```

Expected: 所有工作区测试通过（含新增 core-api、contracts、两个门户组件/服务测试）。

- [ ] **Step 4: 手工冒烟（Playwright MCP 或浏览器）**

- 运营端 `http://localhost:3001` 用 `admin/admin123` 登录：
  - `/categories`：空树不崩溃；创建一级 → 二级 → 三级；编辑名称/状态/属性；删除有子类目的类目提示 409；删除叶子成功。
  - `/brands`：新建品牌并上传 PNG/JPEG/WEBP；非法文件类型与超过 10MB 被拒绝；重名提示 409；停用/启用。
  - `/merchants`：列表分页、关键字筛选；打开详情看到四个店铺；无写操作按钮。
- 商家端 `http://localhost:3000` 用 `merchant@example.com/merchant123` 登录：
  - 店铺资料页修改简介/第三方链接并保存，刷新后保留；`/api/merchant/detail` 展示不回归。
- 直接访问 `http://localhost:4000/uploads/<文件名>` 可看到上传图片；`http://localhost:4000/openapi.json` 可打开。

- [ ] **Step 5: 提交**

```bash
git add CLAUDE.md README.md .env.example
git commit -m "docs: 记录阶段三完成状态与上传配置"
```

---

## Self-Review Notes

- **Spec coverage:** 对应设计 6.1 的商家/店铺、类目、品牌、MediaAsset；7.1 权限码；7.3 商家范围；9.2 的类目/品牌/商家/店铺/上传端点；11.2 的运营端页面。商品、SKU、审核留到阶段 4，未提前实现。
- **Type consistency:** 所有 DTO/输入类型来自 `packages/contracts`；`CategoryNodeDTO` 为扁平节点，`/tree` 返回扁平数组；`merchantId` 仅来自 JWT；上传返回 `{ id, url }` 与 `uploadResultSchema` 一致。
- **Review Focus 落地:** 空树 → Task 8 测试；重名/删除冲突 → Task 4/5；上传异常与路径穿越 → Task 7；跨租户 → Task 6；种子租户缺失 → Task 6 `missing-merchant` 用例。
- **计划取舍:** 类目不支持移动父级（V1 不要求），因此 `categoryUpdateSchema` 不含 `parentId`；品牌不提供删除（设计端点无 DELETE）；商家端类目/品牌选择组件留到阶段 4 商品表单，本轮只提供只读 API 契约。
