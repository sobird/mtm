# 阶段 4：商品 / 版本 / 审核 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打通商家端商品的创建、编辑、版本化、提交审核、发布/下线，以及运营端商品只读与审核的完整链路。

**Architecture:** `core-api` 新增商品与审核路由，商品内容全部落在 `ProductVersion`；`Product` 仅保存租户归属、编码与当前/已发布版本指针。商家编辑草稿就地更新，已审核版本不可变，编辑时创建新版本。运营端只读，且只能看到处于 `SUBMITTED / APPROVED / PUBLISHED` 的商品。两个门户继续通过各自 BFF 以 60 秒签名服务令牌调用 `core-api`。

**Tech Stack:** Hono 4 + `@hono/zod-openapi` + Zod 4；Prisma 6 + PostgreSQL；Next.js 15 App Router + React 19 + TanStack Query；Vitest。

**Spec:** `docs/superpowers/specs/2026-11-03-open-commerce-admin-design.md`（阶段 4 相关章节：商品、版本、审核、权限）

## Global Constraints

- 包管理 / 脚本：Bun + Turborepo；前端仅 `Next.js 15 App Router`；表单 `React Hook Form + Zod`。
- 端口：商家端 `3000`、运营端 `3001`、`core-api` `4000`。
- 分页默认 `page=1`、`pageSize=20`，`pageSize` 上限 `100`。
- 主键一律 cuid 字符串；种子数据使用固定可读 ID（如 `product-demo-1`）；不建跨库外键。
- `core-api` 成功包络：单对象 `{ data }`，分页 `{ data, meta }`；失败包络 `{ error: { code, message, details } }`。
- 商品版本状态严格为：`DRAFT / SUBMITTED / APPROVED / REJECTED / PUBLISHED / SUPERSEDED / OFFLINE`。
- 商品价格使用 PostgreSQL `Decimal(10,2)`；接口输出为两位小数字符串（如 `"2599.00"`）。
- 已进入审核的版本不可变；编辑 `SUBMITTED` 版本返回 `409`；编辑 `APPROVED / REJECTED / PUBLISHED / SUPERSEDED / OFFLINE` 版本创建新 `DRAFT` 版本。
- 发布是商家手动动作；运营端不得创建、编辑、删除、发布商品。
- 图片上传仅接受 `PNG / JPEG / WEBP`，单文件上限 `10MB`；上传结果形如 `{ id, url }`。
- 商家端页面只能从 `@/components/ui` 导入 UI 原子组件，容器用 `@/components/layout/PageContainer`；运营端页面从 `@mtm/ui` 导入。
- 所有新增接口位于 `/api/v1` 下；BFF 路径位于 `/api/bff` 下。
- 文案使用中文；代码标识符使用英文。
- 测试数据库重置需要环境变量 `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="我同意重置本地开发和测试数据库"`。

## Review Focus

以下五类输入/状态最容易在实现中出错，各自绑定到拥有该代码的任务测试：

1. **跨租户越权**：商家 A 读取/编辑/删除商家 B 的商品必须失败（读取/写入均 `404`）；运营账号无 `PLATFORM_CROSS_TENANT` 且 `merchantScope` 不含该商家时列表不可见、详情 `403`。→ Task 4、Task 5。
2. **已审核版本不可变**：`SUBMITTED` 版本编辑返回 `409`；`APPROVED / REJECTED / PUBLISHED / OFFLINE` 编辑必须生成 `version+1` 的新 `DRAFT`，旧版本内容与状态不变。→ Task 5。
3. **并发重复审核**：两个审核请求同时处理同一 `PENDING` 记录时，只有一个成功，另一个返回 `409 AUDIT_ALREADY_REVIEWED`，且版本状态只变更一次。→ Task 7。
4. **运营端可见性**：`DRAFT / REJECTED / OFFLINE` 商品不得出现在运营列表与详情中。→ Task 4。
5. **分页与状态过滤**：状态过滤作用于“当前版本状态”而非任一历史版本；`meta.total` 与过滤条件一致。→ Task 4。

---

### Task 1: 商品与审核契约

**Files:**

- Create: `packages/contracts/src/api/product.ts`
- Modify: `packages/contracts/src/index.ts`（追加 `export * from './api/product';`）
- Test: `packages/contracts/tests/product-schemas.test.ts`

**Interfaces:**

- Consumes: `idSchema`、`paginationQuerySchema`、`isoDateTimeSchema`（`packages/contracts/src/api/common.ts`）。
- Produces:
  - `productVersionStatusSchema`、`skuStatusSchema`、`productAuditStatusSchema`
  - `skuInputSchema`、`productVersionInputSchema`、`productCreateSchema`、`productUpdateSchema`（= `productVersionInputSchema`）、`productQuerySchema`
  - `productListRowSchema`、`skuSchema`、`productVersionSummarySchema`、`productVersionSchema`、`productDetailSchema`
  - `auditQuerySchema`、`auditRecordSchema`、`auditApproveSchema`、`auditRejectSchema`
  - 对应 `type`：`ProductVersionStatus`、`SkuInput`、`ProductVersionInput`、`ProductCreateInput`、`ProductUpdateInput`、`ProductQuery`、`ProductListRowDTO`、`SkuDTO`、`ProductVersionSummaryDTO`、`ProductVersionDTO`、`ProductDetailDTO`、`AuditQuery`、`AuditRecordDTO`。

- [ ] **Step 1: Write the failing contract test**

```ts
// packages/contracts/tests/product-schemas.test.ts
import { describe, expect, test } from 'vitest';

import {
  auditRejectSchema,
  productCreateSchema,
  productDetailSchema,
  productQuerySchema,
  productVersionInputSchema,
} from '../src';

const VERSION_INPUT = {
  categoryId: 'category-demo-home-sofa',
  brandId: 'brand-demo-1',
  title: ' 北欧三人位布艺沙发 ',
  subtitle: null,
  images: ['data:image/svg+xml;utf8,<svg/>'],
  description: '  舒适耐用的三人位沙发  ',
  attributes: { 'attr-demo-home-sofa-material': '棉麻' },
  skus: [{ skuCode: 'P1001-1', specs: { 规格: '三人位' }, price: 2599, stock: 12 }],
};

describe('product', () => {
  test('创建输入去空格、补齐 SKU 默认值且不接收 mainImageUrl', () => {
    const parsed = productCreateSchema.parse({
      ...VERSION_INPUT,
      shopId: 'shop-demo-1',
      code: ' P1001 ',
      mainImageUrl: '/evil.png',
    });

    expect(parsed.title).toBe('北欧三人位布艺沙发');
    expect(parsed.code).toBe('P1001');
    expect(parsed.skus[0]).toEqual({
      skuCode: 'P1001-1',
      specs: { 规格: '三人位' },
      price: 2599,
      stock: 12,
      status: 'ACTIVE',
    });
    expect(parsed).not.toHaveProperty('mainImageUrl');
  });

  test('图片至少一张、SKU 至少一个、价格为非负数', () => {
    const base = { ...VERSION_INPUT, shopId: 'shop-demo-1', code: 'P1001' };
    expect(productCreateSchema.safeParse({ ...base, images: [] }).success).toBe(false);
    expect(productCreateSchema.safeParse({ ...base, skus: [] }).success).toBe(false);
    expect(productCreateSchema.safeParse({ ...base, skus: [{ skuCode: 'a', price: -1, stock: 0 }] }).success).toBe(
      false
    );
  });

  test('更新输入与版本输入同构，不含 shopId / code', () => {
    expect(productVersionInputSchema.parse(VERSION_INPUT).brandId).toBe('brand-demo-1');
    expect(productVersionInputSchema.safeParse({ ...VERSION_INPUT, shopId: 'x' }).success).toBe(true);
    expect(Object.keys(productVersionInputSchema.parse({ ...VERSION_INPUT, code: 'x' }))).not.toContain('code');
  });

  test('列表查询默认分页并只接受已知状态', () => {
    expect(productQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(productQuerySchema.safeParse({ status: 'PUBLISHED' }).success).toBe(true);
    expect(productQuerySchema.safeParse({ status: 'UNKNOWN' }).success).toBe(false);
  });

  test('详情包含当前版本、线上版本与版本历史', () => {
    const detail = {
      id: 'product-demo-1',
      code: 'P1001',
      title: '北欧三人位布艺沙发',
      mainImageUrl: '/uploads/sofa.png',
      categoryId: 'category-demo-home-sofa',
      categoryName: '沙发',
      brandId: 'brand-demo-1',
      brandName: '青禾',
      shopId: 'shop-demo-1',
      shopName: '青禾家居旗舰店',
      merchantId: 'merchant-demo-1',
      merchantName: '青禾家居有限公司',
      status: 'PUBLISHED',
      version: 1,
      currentVersionId: 'pv-1',
      publishedVersionId: 'pv-1',
      updatedAt: '2026-11-04T00:00:00.000Z',
      currentVersion: {
        id: 'pv-1',
        version: 1,
        status: 'PUBLISHED',
        title: '北欧三人位布艺沙发',
        subtitle: null,
        mainImageUrl: '/uploads/sofa.png',
        images: ['/uploads/sofa.png'],
        description: '描述',
        attributes: { 'attr-demo-home-sofa-material': '棉麻' },
        createdBy: 'account-1',
        createdAt: '2026-11-04T00:00:00.000Z',
        submittedAt: '2026-11-04T00:00:00.000Z',
        reviewedAt: '2026-11-04T00:00:00.000Z',
        publishedAt: '2026-11-04T00:00:00.000Z',
        skus: [
          {
            id: 'sku-1',
            skuCode: 'P1001-1',
            specs: { 规格: '三人位' },
            price: '2599.00',
            stock: 12,
            status: 'ACTIVE',
          },
        ],
      },
      publishedVersion: null,
      versions: [
        {
          id: 'pv-1',
          version: 1,
          status: 'PUBLISHED',
          title: '北欧三人位布艺沙发',
          createdAt: '2026-11-04T00:00:00.000Z',
          submittedAt: '2026-11-04T00:00:00.000Z',
          reviewedAt: '2026-11-04T00:00:00.000Z',
          publishedAt: '2026-11-04T00:00:00.000Z',
        },
      ],
    };
    expect(productDetailSchema.safeParse(detail).success).toBe(true);
    expect(productDetailSchema.safeParse({ ...detail, currentVersion: null }).success).toBe(false);
  });
});

describe('audit', () => {
  test('驳回必须填写原因，通过可不填', () => {
    expect(auditRejectSchema.safeParse({ comment: '图片不清晰' }).success).toBe(true);
    expect(auditRejectSchema.safeParse({ comment: '  ' }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/contracts && bun run test -- tests/product-schemas.test.ts`
Expected: FAIL，报错找不到 `product-schemas` 导入的导出。

- [ ] **Step 3: Implement `packages/contracts/src/api/product.ts`**

```ts
import { z } from 'zod';

import { idSchema, isoDateTimeSchema, paginationQuerySchema } from './common';

export const productVersionStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'PUBLISHED',
  'SUPERSEDED',
  'OFFLINE',
]);

export const skuStatusSchema = z.enum(['ACTIVE', 'DISABLED']);

export const productAuditStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

/** 图片地址既允许 http(s)、相对路径，也允许内联 SVG（种子演示数据）。 */
const imageUrlSchema = z.string().trim().min(1).max(2048);

/** 属性值以类目属性 ID 为键，统一存字符串。 */
export const productAttributeValuesSchema = z.record(z.string().min(1).max(64), z.string().trim().max(500));

export const skuInputSchema = z.object({
  skuCode: z.string().trim().min(1).max(50),
  specs: z.record(z.string().min(1).max(20), z.string().trim().min(1).max(50)).default({}),
  price: z.number().min(0).max(99_999_999.99),
  stock: z.number().int().min(0).max(9_999_999),
  status: skuStatusSchema.default('ACTIVE'),
});

/**
 * 版本级输入。`mainImageUrl` 由服务端取 `images[0]`，不在输入中出现。
 */
export const productVersionInputSchema = z.object({
  categoryId: idSchema,
  brandId: idSchema.nullable(),
  title: z.string().trim().min(1).max(100),
  subtitle: z.string().trim().max(100).nullable(),
  images: z.array(imageUrlSchema).min(1).max(5),
  description: z.string().trim().min(1).max(5000),
  attributes: productAttributeValuesSchema,
  skus: z.array(skuInputSchema).min(1).max(50),
});

export const productCreateSchema = productVersionInputSchema.extend({
  shopId: idSchema,
  code: z.string().trim().min(1).max(50),
});

/** V1 不支持改店铺与商品编码，更新只替换版本内容与类目/品牌。 */
export const productUpdateSchema = productVersionInputSchema;

export const productQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().trim().max(100).optional(),
  status: productVersionStatusSchema.optional(),
});

export const productListRowSchema = z.object({
  id: idSchema,
  code: z.string(),
  title: z.string(),
  mainImageUrl: z.string(),
  categoryId: idSchema,
  categoryName: z.string(),
  brandId: idSchema.nullable(),
  brandName: z.string().nullable(),
  shopId: idSchema,
  shopName: z.string(),
  merchantId: idSchema,
  merchantName: z.string(),
  status: productVersionStatusSchema,
  version: z.number().int().min(1),
  currentVersionId: idSchema,
  publishedVersionId: idSchema.nullable(),
  updatedAt: isoDateTimeSchema,
});

export const skuSchema = z.object({
  id: idSchema,
  skuCode: z.string(),
  specs: z.record(z.string(), z.string()),
  price: z.string(),
  stock: z.number().int(),
  status: skuStatusSchema,
});

export const productVersionSummarySchema = z.object({
  id: idSchema,
  version: z.number().int().min(1),
  status: productVersionStatusSchema,
  title: z.string(),
  createdAt: isoDateTimeSchema,
  submittedAt: isoDateTimeSchema.nullable(),
  reviewedAt: isoDateTimeSchema.nullable(),
  publishedAt: isoDateTimeSchema.nullable(),
});

export const productVersionSchema = productVersionSummarySchema.extend({
  subtitle: z.string().nullable(),
  mainImageUrl: z.string(),
  images: z.array(z.string()),
  description: z.string(),
  attributes: z.record(z.string(), z.string()),
  createdBy: z.string(),
  skus: z.array(skuSchema),
});

export const productDetailSchema = productListRowSchema.extend({
  currentVersion: productVersionSchema,
  publishedVersion: productVersionSchema.nullable(),
  versions: z.array(productVersionSummarySchema),
});

export const auditQuerySchema = paginationQuerySchema.extend({
  status: productAuditStatusSchema.optional(),
  keyword: z.string().trim().max(100).optional(),
});

export const auditProductSchema = z.object({
  id: idSchema,
  code: z.string(),
  title: z.string(),
  mainImageUrl: z.string(),
  version: z.number().int().min(1),
  merchantId: idSchema,
  merchantName: z.string(),
  shopName: z.string(),
  categoryName: z.string(),
});

export const auditRecordSchema = z.object({
  id: idSchema,
  productVersionId: idSchema,
  status: productAuditStatusSchema,
  submitterId: z.string(),
  reviewerId: z.string().nullable(),
  comment: z.string().nullable(),
  submittedAt: isoDateTimeSchema,
  reviewedAt: isoDateTimeSchema.nullable(),
  product: auditProductSchema,
});

export const auditApproveSchema = z.object({
  comment: z.string().trim().max(500).optional(),
});

export const auditRejectSchema = z.object({
  comment: z.string().trim().min(1).max(500),
});

export type ProductVersionStatus = z.infer<typeof productVersionStatusSchema>;
export type SkuStatus = z.infer<typeof skuStatusSchema>;
export type ProductAuditStatus = z.infer<typeof productAuditStatusSchema>;
export type SkuInput = z.input<typeof skuInputSchema>;
export type ProductVersionInput = z.infer<typeof productVersionInputSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
export type ProductListRowDTO = z.infer<typeof productListRowSchema>;
export type SkuDTO = z.infer<typeof skuSchema>;
export type ProductVersionSummaryDTO = z.infer<typeof productVersionSummarySchema>;
export type ProductVersionDTO = z.infer<typeof productVersionSchema>;
export type ProductDetailDTO = z.infer<typeof productDetailSchema>;
export type AuditQuery = z.infer<typeof auditQuerySchema>;
export type AuditRecordDTO = z.infer<typeof auditRecordSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/contracts && bun run test -- tests/product-schemas.test.ts`
Expected: PASS（5 + 1 个用例全部通过）。

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/src/api/product.ts packages/contracts/src/index.ts packages/contracts/tests/product-schemas.test.ts
git commit -m "feat(contracts): 商品版本与审核契约"
```

---

### Task 2: 类目属性输出 ID 并保留更新时的 ID

**Files:**

- Modify: `packages/contracts/src/api/category.ts`
- Modify: `apps/core-api/src/services/categories.ts`
- Modify: `apps/ops-admin/components/catalog/CategoryManager/index.tsx`
- Test: `packages/contracts/tests/api-schemas.test.ts`（更新类目节点用例）
- Test: `apps/core-api/tests/categories.test.ts`（追加属性 ID 用例）
- Test: `apps/ops-admin/tests/components/CategoryManager.test.tsx`（追加属性回传用例）

**Interfaces:**

- Consumes: `idSchema`。
- Produces:
  - `categoryAttributeInputSchema` 新增可选 `id: idSchema.optional()`。
  - 新增 `categoryAttributeSchema`（输出）：`{ id, name, type, required, options, sort }`。
  - `categoryNodeSchema.attributes` 改为 `z.array(categoryAttributeSchema)`。
  - `CategoryAttributeDTO = z.infer<typeof categoryAttributeSchema>`。
  - `updateCategory` 按 `id` 更新/新增属性，删除未提交的属性；未知 `id` 返回 `400 CATEGORY_ATTRIBUTE_INVALID`。

- [ ] **Step 1: Write the failing tests**

在 `packages/contracts/tests/api-schemas.test.ts` 的类目节点对象中给属性补上 `id: 'attr-1'`，并追加：

```ts
test('类目属性输出包含 ID，输入 ID 可选', () => {
  expect(
    categoryCreateSchema.safeParse({
      name: '沙发',
      attributes: [{ id: 'attr-1', name: '材质', type: 'SELECT', options: ['棉麻'] }],
    }).success
  ).toBe(true);
  expect(
    categoryNodeSchema.safeParse({
      id: 'category-demo-1',
      parentId: null,
      name: '家居生活',
      level: 1,
      path: '/category-demo-1',
      sort: 0,
      status: 'ACTIVE',
      attributes: [{ id: 'attr-1', name: '材质', type: 'SELECT', required: false, options: ['棉麻'], sort: 0 }],
    }).success
  ).toBe(true);
  expect(
    categoryNodeSchema.safeParse({
      id: 'category-demo-1',
      parentId: null,
      name: '家居生活',
      level: 1,
      path: '/category-demo-1',
      sort: 0,
      status: 'ACTIVE',
      attributes: [{ name: '材质', type: 'SELECT', required: false, options: ['棉麻'], sort: 0 }],
    }).success
  ).toBe(false);
});
```

在 `apps/core-api/tests/categories.test.ts` 追加：

```ts
test('更新类目属性保留已有属性 ID 并删除未提交属性', async () => {
  const leaf = await prisma.category.findFirstOrThrow({
    where: { level: 3, attributes: { some: {} } },
    include: { attributes: { orderBy: { sort: 'asc' } } },
  });
  const kept = leaf.attributes[0];

  const res = await request(
    `/api/v1/categories/${leaf.id}`,
    'PATCH',
    {
      attributes: [
        {
          id: kept.id,
          name: kept.name,
          type: kept.type,
          required: kept.required,
          options: Array.isArray(kept.options) ? kept.options : [],
          sort: 0,
        },
        { name: '新属性', type: 'TEXT' },
      ],
    },
    opsToken(['category:manage'])
  );

  expect(res.status).toBe(200);
  const node = (await res.json()).data;
  expect(node.attributes).toHaveLength(2);
  expect(node.attributes[0].id).toBe(kept.id);
  expect(await prisma.categoryAttribute.count({ where: { categoryId: leaf.id } })).toBe(2);
});

test('更新类目属性拒绝其他类目的属性 ID', async () => {
  const [category, other] = await Promise.all([
    prisma.category.findFirstOrThrow({ where: { level: 3 } }),
    prisma.category.findFirstOrThrow({ where: { level: 2 }, orderBy: { id: 'asc' } }),
  ]);
  const foreign = await prisma.categoryAttribute.create({
    data: { categoryId: other.id, name: '外部属性', type: 'TEXT', required: false, sort: 0 },
  });

  const res = await request(
    `/api/v1/categories/${category.id}`,
    'PATCH',
    { attributes: [{ id: foreign.id, name: '外部属性', type: 'TEXT' }] },
    opsToken(['category:manage'])
  );

  expect(res.status).toBe(400);
  expect(await res.json()).toMatchObject({ error: { code: 'CATEGORY_ATTRIBUTE_INVALID' } });
});
```

在 `apps/ops-admin/tests/components/CategoryManager.test.tsx` 追加：

```tsx
test('编辑类目时按属性 ID 回传', async () => {
  mocks.apiFetch.mockImplementation((path: string, init?: { method?: string }) => {
    if (path === '/api/bff/categories/tree' && (init?.method ?? 'GET') === 'GET') {
      return Promise.resolve([
        {
          id: 'c3',
          parentId: 'c2',
          name: '沙发',
          level: 3,
          path: '/c1/c2/c3',
          sort: 0,
          status: 'ACTIVE',
          attributes: [{ id: 'attr-1', name: '材质', type: 'TEXT', required: false, options: [], sort: 0 }],
        },
      ]);
    }
    return Promise.resolve({});
  });

  renderManager();
  await userEvent.click(await screen.findByRole('button', { name: '编辑' }));
  await userEvent.click(screen.getByRole('button', { name: '保存' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/bff/categories/c3', {
      method: 'PATCH',
      body: {
        name: '沙发',
        sort: 0,
        status: 'ACTIVE',
        attributes: [{ id: 'attr-1', name: '材质', type: 'TEXT', required: false, options: [], sort: 0 }],
      },
    })
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd packages/contracts && bun run test -- tests/api-schemas.test.ts
cd apps/core-api && bun run test -- tests/categories.test.ts
cd apps/ops-admin && bun run test -- tests/components/CategoryManager.test.tsx
```

Expected: FAIL —— 节点输出缺少 `id` 校验、服务端仍删除重建属性、前端未回传 `id`。

- [ ] **Step 3: Update contracts**

在 `packages/contracts/src/api/category.ts`：

```ts
export const categoryAttributeInputSchema = z
  .object({
    id: idSchema.optional(),
    name: z.string().trim().min(1).max(50),
    type: attributeTypeSchema,
    required: z.boolean().default(false),
    options: z.array(z.string().trim().min(1).max(50)).default([]),
    sort: z.number().int().min(0).default(0),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'SELECT' && value.options.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'SELECT 类型属性至少需要一个选项', path: ['options'] });
    }
  });

export const categoryAttributeSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(50),
  type: attributeTypeSchema,
  required: z.boolean(),
  options: z.array(z.string().trim().min(1).max(50)),
  sort: z.number().int().min(0),
});

export const categoryNodeSchema = z.object({
  // ...原有字段不变
  attributes: z.array(categoryAttributeSchema),
});

export type CategoryAttributeDTO = z.infer<typeof categoryAttributeSchema>;
```

- [ ] **Step 4: Update `apps/core-api/src/services/categories.ts`**

`CategoryRow.attributes` 增加 `id: string`；`toCategoryNode` 的属性映射增加 `id: attribute.id`。

`attributeCreateData` 保持不含 `id`（创建时忽略客户端 ID）。

替换 `updateCategory` 的属性写入块：

```ts
if (input.attributes !== undefined) {
  const existing = await tx.categoryAttribute.findMany({
    where: { categoryId: id },
    select: { id: true },
  });
  const ownedIds = new Set(existing.map(attribute => attribute.id));
  const incomingIds = input.attributes.flatMap(attribute => (attribute.id ? [attribute.id] : []));

  if (incomingIds.some(attributeId => !ownedIds.has(attributeId))) {
    throw new HttpError('CATEGORY_ATTRIBUTE_INVALID', 400, '属性不属于该类目');
  }

  await tx.categoryAttribute.deleteMany({
    where: { categoryId: id, id: { notIn: incomingIds } },
  });

  for (const attribute of input.attributes) {
    const data = {
      name: attribute.name,
      type: attribute.type,
      required: attribute.required,
      options: attribute.options.length > 0 ? attribute.options : Prisma.JsonNull,
      sort: attribute.sort,
    };

    if (attribute.id) {
      await tx.categoryAttribute.update({ where: { id: attribute.id }, data });
    } else {
      await tx.categoryAttribute.create({ data: { categoryId: id, ...data } });
    }
  }
}
```

- [ ] **Step 5: Update CategoryManager drafts**

`AttributeDraft` 增加 `id?: string`；`createEmptyAttribute()` 不设 `id`；`toDraft` 设置 `id: attribute.id`；`fromDrafts` 在存在 ID 时透传：

```ts
function fromDrafts(drafts: AttributeDraft[]): CategoryAttributeInput[] {
  return drafts
    .filter(draft => draft.name.trim().length > 0)
    .map((draft, index) => ({
      ...(draft.id ? { id: draft.id } : {}),
      name: draft.name.trim(),
      type: draft.type,
      required: draft.required,
      options:
        draft.type === 'SELECT'
          ? draft.options
              .split(',')
              .map(option => option.trim())
              .filter(Boolean)
          : [],
      sort: index,
    }));
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run:

```bash
cd packages/contracts && bun run test
cd apps/core-api && bun run test -- tests/categories.test.ts
cd apps/ops-admin && bun run test -- tests/components/CategoryManager.test.tsx
```

Expected: 全部 PASS，且原有类目用例不回归。

- [ ] **Step 7: Commit**

```bash
git add packages/contracts/src/api/category.ts packages/contracts/tests/api-schemas.test.ts \
  apps/core-api/src/services/categories.ts apps/core-api/tests/categories.test.ts \
  apps/ops-admin/components/catalog/CategoryManager/index.tsx apps/ops-admin/tests/components/CategoryManager.test.tsx
git commit -m "feat(category): 属性输出并保留 ID"
```

---

### Task 3: Prisma 版本指针关系与迁移

**Files:**

- Modify: `apps/core-api/prisma/schema.prisma`
- Create: `apps/core-api/prisma/migrations/<timestamp>_phase4_product_versions/migration.sql`（由 Prisma 生成）
- Modify: `apps/core-api/tests/helpers.ts`（`resetCoreFixtures` 增加商品相关表）
- Test: `apps/core-api/tests/prisma-schema.test.ts`

**Interfaces:**

- Produces:
  - `Product.currentVersion: ProductVersion?`（关系名 `ProductCurrentVersion`）
  - `Product.publishedVersion: ProductVersion?`（关系名 `ProductPublishedVersion`）
  - `ProductVersion.currentOf: Product[]`、`ProductVersion.publishedOf: Product[]`
  - `ProductVersion.@@unique([productId, version])`
  - 索引：`Product(merchantId, deletedAt)`、`Product(shopId)`、`Product(categoryId)`、`ProductVersion(productId, status)`、`Sku(productVersionId)`、`AuditRecord(status, submittedAt)`、`AuditRecord(productVersionId)`。

- [ ] **Step 1: Write the failing schema test**

```ts
// apps/core-api/tests/prisma-schema.test.ts
import { beforeEach, expect, test } from 'vitest';

import { prisma } from '@/src/db';

import { resetCoreFixtures } from './helpers';

beforeEach(resetCoreFixtures);

test('商品可关联当前版本与已发布版本', async () => {
  const product = await prisma.product.create({
    data: { merchantId: 'merchant-x', shopId: 'shop-x', categoryId: 'category-x', code: 'SCHEMA-1' },
  });
  const version = await prisma.productVersion.create({
    data: {
      productId: product.id,
      version: 1,
      title: '测试商品',
      mainImageUrl: 'data:image/svg+xml;utf8,<svg/>',
      images: [],
      description: '描述',
      attributes: {},
      createdBy: 'account-x',
    },
  });

  await prisma.product.update({
    where: { id: product.id },
    data: { currentVersionId: version.id, publishedVersionId: version.id },
  });

  const loaded = await prisma.product.findUniqueOrThrow({
    where: { id: product.id },
    include: { currentVersion: true, publishedVersion: true },
  });

  expect(loaded.currentVersion?.id).toBe(version.id);
  expect(loaded.publishedVersion?.id).toBe(version.id);
});

test('同一商品的版本号唯一', async () => {
  const product = await prisma.product.create({
    data: { merchantId: 'merchant-x', shopId: 'shop-x', categoryId: 'category-x', code: 'SCHEMA-2' },
  });
  const data = {
    productId: product.id,
    version: 1,
    title: '测试商品',
    mainImageUrl: 'data:image/svg+xml;utf8,<svg/>',
    images: [],
    description: '描述',
    attributes: {},
    createdBy: 'account-x',
  };

  await prisma.productVersion.create({ data });
  await expect(prisma.productVersion.create({ data })).rejects.toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/core-api && bun run test -- tests/prisma-schema.test.ts`
Expected: FAIL —— Prisma Client 不认识 `currentVersion` / `publishedVersion`。

- [ ] **Step 3: Update the Prisma schema**

在 `model Product` 追加：

```prisma
  currentVersion   ProductVersion? @relation("ProductCurrentVersion", fields: [currentVersionId], references: [id])
  publishedVersion ProductVersion? @relation("ProductPublishedVersion", fields: [publishedVersionId], references: [id])

  @@index([merchantId, deletedAt])
  @@index([shopId])
  @@index([categoryId])
```

在 `model ProductVersion` 追加：

```prisma
  currentOf   Product[] @relation("ProductCurrentVersion")
  publishedOf Product[] @relation("ProductPublishedVersion")

  @@unique([productId, version])
  @@index([productId, status])
```

在 `model Sku` 追加 `@@index([productVersionId])`；在 `model AuditRecord` 追加 `@@index([status, submittedAt])` 与 `@@index([productVersionId])`。

- [ ] **Step 4: Generate the migration and client**

Run:

```bash
cd apps/core-api && bun run db:migrate:dev --name phase4_product_versions
```

Expected: 生成迁移并应用，`prisma generate` 自动执行成功。

- [ ] **Step 5: Update `resetCoreFixtures`**

```ts
export async function resetCoreFixtures(): Promise<void> {
  // Product 与 ProductVersion 互相引用，先清空指针再按依赖顺序删除。
  await prisma.product.updateMany({ data: { currentVersionId: null, publishedVersionId: null } });
  await prisma.auditRecord.deleteMany();
  await prisma.sku.deleteMany();
  await prisma.productVersion.deleteMany();
  await prisma.product.deleteMany();
  await prisma.categoryAttribute.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.mediaAsset.deleteMany();
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd apps/core-api && bun run test -- tests/prisma-schema.test.ts`
Expected: PASS（2 个用例）。

- [ ] **Step 7: Commit**

```bash
git add apps/core-api/prisma/schema.prisma apps/core-api/prisma/migrations apps/core-api/tests/helpers.ts apps/core-api/tests/prisma-schema.test.ts
git commit -m "feat(core-api): 商品版本指针关系与迁移"
```

---

### Task 4: 商品创建、列表与详情

**Files:**

- Create: `apps/core-api/src/services/products.ts`
- Create: `apps/core-api/src/routes/products.ts`
- Modify: `apps/core-api/src/app.ts`（注册 `registerProductRoutes`）
- Modify: `apps/core-api/src/routes/uploads.ts`（商家上传权限增加 `PRODUCT_CREATE`）
- Test: `apps/core-api/tests/products.test.ts`
- Test: `apps/core-api/tests/uploads.test.ts`（追加 `product:create` 可上传）

**Interfaces:**

- Consumes: `ProductCreateInput`、`ProductQuery`、`ProductListRowDTO`、`ProductDetailDTO`；`requireAnyPermission`、`requireMerchantPermission`；`canAccessMerchant`、`assertMerchantVisible`、`normalizePage`、`sendData`、`sendPage`。
- Produces:
  - `createProduct(auth, input): Promise<ProductDetailDTO>`
  - `listProducts(auth, query): Promise<{ items: ProductListRowDTO[]; meta: PageMeta }>`
  - `getProduct(auth, id): Promise<ProductDetailDTO>`
  - `assertVersionInput(input): Promise<void>`（Task 5/6/7 复用；校验类目/品牌/属性/SKU）
  - 路由：`GET /api/v1/products`、`POST /api/v1/products`、`GET /api/v1/products/{id}`。

**关键规则：**

- 商家查询强制 `merchantId = auth.merchantId`；运营按 `merchantScope`（`PLATFORM_CROSS_TENANT` 或 `merchantScope === null` 视为全部）。
- 运营列表/详情只暴露当前版本状态 ∈ `SUBMITTED / APPROVED / PUBLISHED` 的商品；否则列表不返回、详情 `404 PRODUCT_NOT_FOUND`。
- 商家详情查非本租户商品返回 `404 PRODUCT_NOT_FOUND`；运营越权详情返回 `403 FORBIDDEN`。
- 名称字段（merchant/shop/category/brand）通过额外 `findMany` 批量补齐，不新增跨表关系。
- `code` 唯一冲突（Prisma `P2002`）→ `409 PRODUCT_CODE_EXISTS`；`shopId` 不属于当前商家 → `400 PRODUCT_SHOP_INVALID`。

- [ ] **Step 1: Write the failing tests**

```ts
// apps/core-api/tests/products.test.ts
import { DEMO_MERCHANT_ID } from '@mtm/contracts';
import { beforeEach, expect, test } from 'vitest';

import { seedCoreData } from '@/prisma/seed-data';
import { createApp } from '@/src/app';
import { prisma } from '@/src/db';

import { merchantToken, opsToken, resetCoreFixtures } from './helpers';

beforeEach(async () => {
  await resetCoreFixtures();
  await seedCoreData(prisma);
});

const CREATE_BODY = {
  shopId: 'shop-demo-1',
  code: 'TEST-P1',
  categoryId: 'category-demo-home-sofa',
  brandId: 'brand-demo-1',
  title: '测试沙发',
  subtitle: null,
  images: ['data:image/svg+xml;utf8,<svg/>'],
  description: '测试描述',
  attributes: { 'attr-demo-home-sofa-material': '棉麻' },
  skus: [{ skuCode: 'TEST-P1-1', specs: { 规格: '三人位' }, price: 2599, stock: 10 }],
};

async function request(path: string, method: string, body: unknown, token: Promise<string>) {
  const headers: Record<string, string> = { authorization: `Bearer ${await token}` };
  if (body !== undefined) headers['content-type'] = 'application/json';
  return createApp().request(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function get(path: string, token: Promise<string>) {
  return request(path, 'GET', undefined, token);
}

test('商家创建商品生成 DRAFT v1 并回传类目/品牌/店铺名称', async () => {
  const res = await request(
    '/api/v1/products',
    'POST',
    CREATE_BODY,
    merchantToken(DEMO_MERCHANT_ID, ['product:create'])
  );

  expect(res.status).toBe(200);
  const detail = (await res.json()).data;
  expect(detail).toMatchObject({
    code: 'TEST-P1',
    title: '测试沙发',
    status: 'DRAFT',
    version: 1,
    merchantName: '青禾家居有限公司',
    shopName: '青禾家居旗舰店',
    categoryName: '沙发',
    brandName: '青禾',
  });
  expect(detail.currentVersion.mainImageUrl).toBe(CREATE_BODY.images[0]);
  expect(detail.currentVersion.skus[0]).toMatchObject({ price: '2599.00', stock: 10 });
});

test('重复商品编码返回 409', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create']);
  expect((await request('/api/v1/products', 'POST', CREATE_BODY, token)).status).toBe(200);
  const duplicate = await request('/api/v1/products', 'POST', { ...CREATE_BODY }, token);
  expect(duplicate.status).toBe(409);
  expect(await duplicate.json()).toMatchObject({ error: { code: 'PRODUCT_CODE_EXISTS' } });
});

test('类目属性缺失必填项或选项非法返回 400', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create']);

  const missing = await request('/api/v1/products', 'POST', { ...CREATE_BODY, code: 'TEST-P2', attributes: {} }, token);
  expect(missing.status).toBe(400);
  expect(await missing.json()).toMatchObject({ error: { code: 'PRODUCT_ATTRIBUTE_REQUIRED' } });

  const illegal = await request(
    '/api/v1/products',
    'POST',
    { ...CREATE_BODY, code: 'TEST-P3', attributes: { 'attr-demo-home-sofa-material': '石头' } },
    token
  );
  expect(illegal.status).toBe(400);
  expect(await illegal.json()).toMatchObject({ error: { code: 'PRODUCT_ATTRIBUTE_INVALID' } });
});

test('商家列表只返回本商家商品，运营只看到已提交/已通过/已发布', async () => {
  const merchantTokenValue = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:view']);
  const created = await request('/api/v1/products', 'POST', CREATE_BODY, merchantTokenValue);
  const productId = (await created.json()).data.id;

  const merchantList = await get('/api/v1/products', merchantTokenValue);
  expect(merchantList.status).toBe(200);
  const merchantBody = await merchantList.json();
  expect(merchantBody.meta.total).toBe(1);
  expect(merchantBody.data[0].id).toBe(productId);

  const opsList = await get('/api/v1/products', opsToken(['product:view']));
  const opsBody = await opsList.json();
  expect(opsBody.data.some((row: { id: string }) => row.id === productId)).toBe(false);

  await prisma.productVersion.update({
    where: { id: (await created.json()).data.currentVersionId },
    data: { status: 'SUBMITTED' },
  });
  const visible = await get('/api/v1/products', opsToken(['product:view']));
  expect((await visible.json()).data.some((row: { id: string }) => row.id === productId)).toBe(true);
});

test('跨租户读取返回 404，运营范围外返回 403', async () => {
  const created = await request(
    '/api/v1/products',
    'POST',
    CREATE_BODY,
    merchantToken(DEMO_MERCHANT_ID, ['product:create'])
  );
  const productId = (await created.json()).data.id;

  expect((await get(`/api/v1/products/${productId}`, merchantToken('merchant-demo-2', ['product:view']))).status).toBe(
    404
  );

  await prisma.productVersion.updateMany({ where: { productId }, data: { status: 'SUBMITTED' } });
  expect((await get(`/api/v1/products/${productId}`, opsToken(['product:view'], ['merchant-demo-2']))).status).toBe(
    403
  );
});

test('运营状态过滤作用于当前版本且分页 meta 正确', async () => {
  const merchantTokenValue = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:view']);

  for (const code of ['TEST-F1', 'TEST-F2']) {
    const created = await request('/api/v1/products', 'POST', { ...CREATE_BODY, code }, merchantTokenValue);
    const detail = (await created.json()).data;
    await prisma.productVersion.update({ where: { id: detail.currentVersionId }, data: { status: 'SUBMITTED' } });
  }

  const res = await get('/api/v1/products?status=SUBMITTED&page=1&pageSize=1', opsToken(['product:view']));
  const body = await res.json();
  expect(body.data).toHaveLength(1);
  expect(body.meta).toEqual({ page: 1, pageSize: 1, total: 2 });
});
```

在 `apps/core-api/tests/uploads.test.ts` 追加一个断言：拥有 `product:create` 的商家上传返回 200（按该文件已有的 multipart 构造方式编写）。

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/core-api && bun run test -- tests/products.test.ts`
Expected: FAIL —— 路由不存在（404）。

- [ ] **Step 3: Implement `apps/core-api/src/services/products.ts`**

实现要点（每位实现者按此签名落地）：

```ts
type ProductWithVersion = Prisma.ProductGetPayload<{
  include: {
    currentVersion: { include: { skus: true } };
    publishedVersion: { include: { skus: true } };
    versions: true;
  };
}>;

const OPS_VISIBLE_STATUSES = ['SUBMITTED', 'APPROVED', 'PUBLISHED'] as const;

export async function assertVersionInput(input: ProductVersionInput): Promise<void>;
export async function createProduct(auth: ServiceTokenClaims, input: ProductCreateInput): Promise<ProductDetailDTO>;
export async function listProducts(
  auth: ServiceTokenClaims,
  query: ProductQuery
): Promise<{ items: ProductListRowDTO[]; meta: PageMeta }>;
export async function getProduct(auth: ServiceTokenClaims, id: string): Promise<ProductDetailDTO>;
```

- `assertVersionInput`：
  - 类目不存在 → `400 PRODUCT_CATEGORY_INVALID`；
  - `brandId` 非空且品牌不存在或 `DISABLED` → `400 PRODUCT_BRAND_INVALID`；
  - 读取类目属性，构造 `Map<id, attribute>`；
  - `Object.keys(input.attributes)` 出现未知 ID → `400 PRODUCT_ATTRIBUTE_UNKNOWN`；
  - `required` 属性缺失或值为空 → `400 PRODUCT_ATTRIBUTE_REQUIRED`；
  - `SELECT` 值不在 `options`、`NUMBER` 值非有限数字 → `400 PRODUCT_ATTRIBUTE_INVALID`；
  - `skus` 的 `skuCode` 重复（忽略大小写）→ `400 PRODUCT_SKU_DUPLICATE`。
- `createProduct`：
  - 校验 `auth.portal === 'merchant' && auth.merchantId`；
  - `shop.findFirst({ where: { id: input.shopId, merchantId } })` 不存在 → `400 PRODUCT_SHOP_INVALID`；
  - `assertVersionInput(input)`；
  - 事务内：创建 `Product`（不含指针）→ 创建 `ProductVersion`（`version: 1`、`status: 'DRAFT'`、`mainImageUrl: input.images[0]`、`createdBy: auth.userId`、嵌套 `skus.create`）→ `product.update` 写 `currentVersionId`；
  - 捕获 `P2002` → `409 PRODUCT_CODE_EXISTS`；
  - 返回 `getProduct(auth, product.id)`。
- `listProducts`：
  - 构建 `where: { deletedAt: null }`；
  - 商家：`where.merchantId = auth.merchantId ?? '__none__'`；
  - 运营：范围过滤 `merchantId in merchantScope`；并把 `where.currentVersion = { is: { status: { in: allowed } } }`，`allowed = query.status ? [query.status].filter(s => OPS_VISIBLE.includes(s)) : OPS_VISIBLE`；
  - 商家：`query.status` 存在时 `where.currentVersion = { is: { status: query.status } }`；
  - 关键字：`where.OR = [{ code: { contains, mode: 'insensitive' } }, { currentVersion: { is: { title: { contains, mode: 'insensitive' } } } }]`；
  - `include`：`currentVersion`（`id/version/status/title/mainImageUrl`）、`publishedVersion`（`id`）、`versions`（不需要）；
  - 用 `$transaction([count, findMany])` 取分页；`orderBy: [{ updatedAt: 'desc' }]`；
  - 批量查询 `merchant/shop/category/brand` 名称并映射列表行。
- `getProduct`：
  - `findFirst({ where: { id, deletedAt: null }, include: { currentVersion: { include: { skus: true } }, publishedVersion: { include: { skus: true } }, versions: { orderBy: { version: 'desc' }, take: 20 } } })`；
  - 商家：`product.merchantId !== auth.merchantId` → `404 PRODUCT_NOT_FOUND`；
  - 运营：`assertMerchantVisible(auth, product.merchantId)`；`currentVersion.status` 不在可见集合 → `404 PRODUCT_NOT_FOUND`；
  - 映射详情（`mainImageUrl`、`images as string[]`、`attributes as Record<string,string>`、`sku.price.toFixed(2)`、日期 `.toISOString()`）。
- 导出 `assertVersionInput` 供 Task 5/6 复用。

- [ ] **Step 4: Implement `apps/core-api/src/routes/products.ts`**

按 `brands.ts` 的 `createRoute` 结构注册三条路由：

```ts
const listProductsRoute = createRoute({
  method: 'get',
  path: '/api/v1/products',
  tags: ['product'],
  security: [{ bearerAuth: [] }],
  middleware: requireAnyPermission([PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.PRODUCT_AUDIT]),
  request: { query: productQuerySchema },
  responses: {
    200: { description: '商品分页列表', content: { 'application/json': { schema: pageSchema(productListRowSchema) } } },
    ...sharedErrors,
  },
});

const createProductRoute = createRoute({
  method: 'post',
  path: '/api/v1/products',
  tags: ['product'],
  security: [{ bearerAuth: [] }],
  middleware: requireMerchantPermission(PERMISSIONS.PRODUCT_CREATE),
  request: { body: { required: true, content: { 'application/json': { schema: productCreateSchema } } } },
  responses: {
    200: {
      description: '创建后的商品详情',
      content: { 'application/json': { schema: z.object({ data: productDetailSchema }) } },
    },
    ...sharedErrors,
    409: errorResponse('商品编码已存在'),
  },
});

const productDetailRoute = createRoute({
  method: 'get',
  path: '/api/v1/products/{id}',
  tags: ['product'],
  security: [{ bearerAuth: [] }],
  middleware: requireAnyPermission([PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.PRODUCT_AUDIT]),
  request: { params: z.object({ id: idSchema }) },
  responses: {
    200: {
      description: '商品详情',
      content: { 'application/json': { schema: z.object({ data: productDetailSchema }) } },
    },
    ...sharedErrors,
    404: errorResponse('商品不存在'),
  },
});
```

处理器分别调用 `listProducts` / `createProduct` / `getProduct`，并用 `sendPage` / `sendData` 返回。

- [ ] **Step 5: Register routes and allow `product:create` uploads**

`apps/core-api/src/app.ts`：

```ts
import { registerProductRoutes } from './routes/products';
// ...
registerProductRoutes(app);
```

`apps/core-api/src/routes/uploads.ts`：

```ts
const MERCHANT_UPLOAD_PERMISSIONS = [
  PERMISSIONS.PRODUCT_CREATE,
  PERMISSIONS.PRODUCT_UPDATE,
  PERMISSIONS.SHOP_UPDATE,
] as const;
```

- [ ] **Step 6: Run tests to verify they pass**

Run:

```bash
cd apps/core-api && bun run test -- tests/products.test.ts tests/uploads.test.ts tests/openapi.test.ts
```

Expected: PASS；`openapi.test.ts` 能列出新增路径。

- [ ] **Step 7: Commit**

```bash
git add apps/core-api/src/services/products.ts apps/core-api/src/routes/products.ts apps/core-api/src/app.ts \
  apps/core-api/src/routes/uploads.ts apps/core-api/tests/products.test.ts apps/core-api/tests/uploads.test.ts
git commit -m "feat(core-api): 商品创建、列表与详情"
```

---

### Task 5: 商品更新与版本化

**Files:**

- Modify: `apps/core-api/src/services/products.ts`
- Modify: `apps/core-api/src/routes/products.ts`
- Test: `apps/core-api/tests/products.test.ts`（追加用例）

**Interfaces:**

- Consumes: `assertVersionInput`、`getProduct`（Task 4）、`ProductUpdateInput`。
- Produces: `updateProduct(auth, id, input): Promise<ProductDetailDTO>`；路由 `PATCH /api/v1/products/{id}`（`requireMerchantPermission(PRODUCT_UPDATE)`）。

**关键规则：**

- 非本租户 → `404 PRODUCT_NOT_FOUND`；`auth.portal !== 'merchant'` 由中间件拦截。
- `currentVersion.status === 'SUBMITTED'` → `409 PRODUCT_IN_REVIEW`。
- `DRAFT` → 就地更新当前版本（替换 SKU、更新商品类目/品牌），版本号与 ID 不变。
- 其他状态 → 新建 `version = max(version) + 1`、`status = 'DRAFT'` 的版本，把 `currentVersionId` 指向新版本；旧版本内容与状态不变。
- 并发创建新版本触发 `@@unique([productId, version])` → `409 PRODUCT_VERSION_CONFLICT`。

- [ ] **Step 1: Write the failing tests**

在 `apps/core-api/tests/products.test.ts` 追加（复用 `CREATE_BODY` / `request` / `get`）：

```ts
test('草稿就地更新，版本号不变', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:update', 'product:view']);
  const created = await request('/api/v1/products', 'POST', CREATE_BODY, token);
  const detail = (await created.json()).data;

  const res = await request(`/api/v1/products/${detail.id}`, 'PATCH', { ...CREATE_BODY, title: '改名沙发' }, token);
  expect(res.status).toBe(200);
  const updated = (await res.json()).data;
  expect(updated.currentVersionId).toBe(detail.currentVersionId);
  expect(updated.version).toBe(1);
  expect(updated.title).toBe('改名沙发');
});

test('已提交商品编辑返回 409', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:update', 'product:view']);
  const created = await request('/api/v1/products', 'POST', CREATE_BODY, token);
  const detail = (await created.json()).data;
  await prisma.productVersion.update({ where: { id: detail.currentVersionId }, data: { status: 'SUBMITTED' } });

  const res = await request(`/api/v1/products/${detail.id}`, 'PATCH', { ...CREATE_BODY, title: '改名' }, token);
  expect(res.status).toBe(409);
  expect(await res.json()).toMatchObject({ error: { code: 'PRODUCT_IN_REVIEW' } });
});

test('编辑已驳回版本创建 v2 草稿且保留 v1', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:update', 'product:view']);
  const created = await request('/api/v1/products', 'POST', CREATE_BODY, token);
  const detail = (await created.json()).data;
  await prisma.productVersion.update({ where: { id: detail.currentVersionId }, data: { status: 'REJECTED' } });

  const res = await request(`/api/v1/products/${detail.id}`, 'PATCH', { ...CREATE_BODY, title: '第二版沙发' }, token);
  expect(res.status).toBe(200);
  const updated = (await res.json()).data;
  expect(updated.version).toBe(2);
  expect(updated.status).toBe('DRAFT');
  expect(updated.currentVersionId).not.toBe(detail.currentVersionId);

  const v1 = await prisma.productVersion.findUniqueOrThrow({ where: { id: detail.currentVersionId } });
  expect(v1.status).toBe('REJECTED');
  expect(v1.title).toBe('测试沙发');
});

test('跨租户编辑返回 404', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:update', 'product:view']);
  const created = await request('/api/v1/products', 'POST', CREATE_BODY, token);
  const detail = (await created.json()).data;

  const res = await request(
    `/api/v1/products/${detail.id}`,
    'PATCH',
    { ...CREATE_BODY, title: '越权' },
    merchantToken('merchant-demo-2', ['product:update'])
  );
  expect(res.status).toBe(404);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/core-api && bun run test -- tests/products.test.ts`
Expected: FAIL —— PATCH 路由 404。

- [ ] **Step 3: Implement `updateProduct`**

```ts
export async function updateProduct(
  auth: ServiceTokenClaims,
  id: string,
  input: ProductUpdateInput
): Promise<ProductDetailDTO> {
  if (auth.portal !== 'merchant' || !auth.merchantId) {
    throw new HttpError('FORBIDDEN', 403, '无权访问');
  }

  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: { currentVersion: true },
  });

  if (!product || product.merchantId !== auth.merchantId) {
    throw new HttpError('PRODUCT_NOT_FOUND', 404, '商品不存在');
  }

  if (!product.currentVersion) {
    throw new HttpError('PRODUCT_NOT_FOUND', 404, '商品不存在');
  }

  if (product.currentVersion.status === 'SUBMITTED') {
    throw new HttpError('PRODUCT_IN_REVIEW', 409, '商品审核中，无法编辑');
  }

  await assertVersionInput(input);

  const versionData = {
    categoryId: undefined, // 仅用于类型对照，版本表不存类目
    title: input.title,
    subtitle: input.subtitle,
    mainImageUrl: input.images[0],
    images: input.images,
    description: input.description,
    attributes: input.attributes,
  };

  try {
    if (product.currentVersion.status === 'DRAFT') {
      await prisma.$transaction([
        prisma.productVersion.update({
          where: { id: product.currentVersion.id },
          data: {
            title: versionData.title,
            subtitle: versionData.subtitle,
            mainImageUrl: versionData.mainImageUrl,
            images: versionData.images,
            description: versionData.description,
            attributes: versionData.attributes,
            skus: { deleteMany: {}, create: input.skus },
          },
        }),
        prisma.product.update({
          where: { id },
          data: { categoryId: input.categoryId, brandId: input.brandId },
        }),
      ]);
    } else {
      await prisma.$transaction(async tx => {
        const latest = await tx.productVersion.aggregate({
          where: { productId: id },
          _max: { version: true },
        });
        const created = await tx.productVersion.create({
          data: {
            productId: id,
            version: (latest._max.version ?? 0) + 1,
            status: 'DRAFT',
            title: versionData.title,
            subtitle: versionData.subtitle,
            mainImageUrl: versionData.mainImageUrl,
            images: versionData.images,
            description: versionData.description,
            attributes: versionData.attributes,
            createdBy: auth.userId,
            skus: { create: input.skus },
          },
        });
        await tx.product.update({
          where: { id },
          data: { categoryId: input.categoryId, brandId: input.brandId, currentVersionId: created.id },
        });
      });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError('PRODUCT_VERSION_CONFLICT', 409, '商品版本冲突，请重试');
    }
    throw error;
  }

  return getProduct(auth, id);
}
```

注册路由：

```ts
const updateProductRoute = createRoute({
  method: 'patch',
  path: '/api/v1/products/{id}',
  tags: ['product'],
  security: [{ bearerAuth: [] }],
  middleware: requireMerchantPermission(PERMISSIONS.PRODUCT_UPDATE),
  request: {
    params: z.object({ id: idSchema }),
    body: { required: true, content: { 'application/json': { schema: productUpdateSchema } } },
  },
  responses: {
    200: {
      description: '更新后的商品详情',
      content: { 'application/json': { schema: z.object({ data: productDetailSchema }) } },
    },
    ...sharedErrors,
    404: errorResponse('商品不存在'),
    409: errorResponse('商品审核中或版本冲突'),
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/core-api && bun run test -- tests/products.test.ts`
Expected: PASS（含 Task 4 用例）。

- [ ] **Step 5: Commit**

```bash
git add apps/core-api/src/services/products.ts apps/core-api/src/routes/products.ts apps/core-api/tests/products.test.ts
git commit -m "feat(core-api): 商品更新与版本化"
```

---

### Task 6: 提交、发布、下线与删除

**Files:**

- Modify: `apps/core-api/src/services/products.ts`
- Modify: `apps/core-api/src/routes/products.ts`
- Test: `apps/core-api/tests/products.test.ts`（追加用例）

**Interfaces:**

- Produces:
  - `submitProduct(auth, id): Promise<ProductDetailDTO>`
  - `publishProduct(auth, id): Promise<ProductDetailDTO>`
  - `offlineProduct(auth, id): Promise<ProductDetailDTO>`
  - `deleteProduct(auth, id): Promise<void>`
  - 路由：`POST /api/v1/products/{id}/submit`（`product:submit`）、`POST /api/v1/products/{id}/publish`（`product:publish`）、`POST /api/v1/products/{id}/offline`（`product:publish`）、`DELETE /api/v1/products/{id}`（`product:delete`）。

**关键规则：**

- 提交：仅 `DRAFT` 可提交；`updateMany({ where: { id, status: 'DRAFT' } })` 计数为 0 → `409 PRODUCT_NOT_DRAFT`；成功后创建 `AuditRecord`（`PENDING`、`submitterId = auth.userId`）。
- 发布：当前版本必须 `APPROVED`；若已存在旧 `publishedVersionId` 且不等于当前版本，先把旧版本置 `SUPERSEDED`；当前版本置 `PUBLISHED` 并写 `publishedAt`；`publishedVersionId = currentVersion.id`。
- 下线：必须存在 `publishedVersionId`；该版本置 `OFFLINE`；清空 `publishedVersionId`。
- 删除：`currentVersion.status === 'SUBMITTED'` → `409 PRODUCT_IN_REVIEW`；`publishedVersionId !== null` → `409 PRODUCT_PUBLISHED`；否则写 `deletedAt`。
- 所有动作先按 Task 5 的租户校验取商品，非本租户 `404`。

- [ ] **Step 1: Write the failing tests**

在 `apps/core-api/tests/products.test.ts` 追加：

```ts
async function createDraft(token: Promise<string>, code: string) {
  const res = await request('/api/v1/products', 'POST', { ...CREATE_BODY, code }, token);
  return (await res.json()).data;
}

test('提交草稿进入 SUBMITTED 并生成待审核记录', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:submit', 'product:view']);
  const detail = await createDraft(token, 'TEST-S1');

  const res = await request(`/api/v1/products/${detail.id}/submit`, 'POST', undefined, token);
  expect(res.status).toBe(200);
  expect((await res.json()).data.status).toBe('SUBMITTED');

  const audit = await prisma.auditRecord.findFirstOrThrow({ where: { productVersionId: detail.currentVersionId } });
  expect(audit.status).toBe('PENDING');
  expect(audit.submitterId).toBe('merchant-test');
});

test('非草稿再次提交返回 409', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:submit', 'product:view']);
  const detail = await createDraft(token, 'TEST-S2');
  expect((await request(`/api/v1/products/${detail.id}/submit`, 'POST', undefined, token)).status).toBe(200);

  const again = await request(`/api/v1/products/${detail.id}/submit`, 'POST', undefined, token);
  expect(again.status).toBe(409);
  expect(await again.json()).toMatchObject({ error: { code: 'PRODUCT_NOT_DRAFT' } });
});

test('发布已通过版本并把旧线上版本置为 SUPERSEDED', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, [
    'product:create',
    'product:update',
    'product:submit',
    'product:publish',
    'product:view',
  ]);
  const detail = await createDraft(token, 'TEST-PUB');

  // 直接模拟“v1 已发布、v2 已审核通过”。
  const v2 = await prisma.productVersion.create({
    data: {
      productId: detail.id,
      version: 2,
      status: 'APPROVED',
      title: '第二版',
      mainImageUrl: detail.currentVersion.mainImageUrl,
      images: [],
      description: '描述',
      attributes: {},
      createdBy: 'merchant-test',
    },
  });
  await prisma.product.update({
    where: { id: detail.id },
    data: { publishedVersionId: detail.currentVersionId, currentVersionId: v2.id },
  });

  const res = await request(`/api/v1/products/${detail.id}/publish`, 'POST', undefined, token);
  expect(res.status).toBe(200);
  const published = (await res.json()).data;
  expect(published.status).toBe('PUBLISHED');
  expect(published.publishedVersionId).toBe(v2.id);

  const old = await prisma.productVersion.findUniqueOrThrow({ where: { id: detail.currentVersionId } });
  expect(old.status).toBe('SUPERSEDED');
});

test('未通过审核发布返回 409', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:publish', 'product:view']);
  const detail = await createDraft(token, 'TEST-PUB2');

  const res = await request(`/api/v1/products/${detail.id}/publish`, 'POST', undefined, token);
  expect(res.status).toBe(409);
  expect(await res.json()).toMatchObject({ error: { code: 'PRODUCT_NOT_APPROVED' } });
});

test('下线已发布商品后清空线上版本', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:publish', 'product:view']);
  const detail = await createDraft(token, 'TEST-OFF');
  await prisma.productVersion.update({ where: { id: detail.currentVersionId }, data: { status: 'PUBLISHED' } });
  await prisma.product.update({ where: { id: detail.id }, data: { publishedVersionId: detail.currentVersionId } });

  const res = await request(`/api/v1/products/${detail.id}/offline`, 'POST', undefined, token);
  expect(res.status).toBe(200);
  expect((await res.json()).data.publishedVersionId).toBeNull();

  const version = await prisma.productVersion.findUniqueOrThrow({ where: { id: detail.currentVersionId } });
  expect(version.status).toBe('OFFLINE');
});

test('已提交或已发布商品不可删除，下线后可删除', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:delete', 'product:view']);
  const submitted = await createDraft(token, 'TEST-D1');
  await prisma.productVersion.update({ where: { id: submitted.currentVersionId }, data: { status: 'SUBMITTED' } });
  const blocked = await request(`/api/v1/products/${submitted.id}`, 'DELETE', undefined, token);
  expect(blocked.status).toBe(409);
  expect(await blocked.json()).toMatchObject({ error: { code: 'PRODUCT_IN_REVIEW' } });

  const published = await createDraft(token, 'TEST-D2');
  await prisma.productVersion.update({
    where: { id: published.currentVersionId },
    data: { status: 'PUBLISHED' },
  });
  await prisma.product.update({
    where: { id: published.id },
    data: { publishedVersionId: published.currentVersionId },
  });
  const publishedBlocked = await request(`/api/v1/products/${published.id}`, 'DELETE', undefined, token);
  expect(publishedBlocked.status).toBe(409);
  expect(await publishedBlocked.json()).toMatchObject({ error: { code: 'PRODUCT_PUBLISHED' } });

  const draft = await createDraft(token, 'TEST-D3');
  expect((await request(`/api/v1/products/${draft.id}`, 'DELETE', undefined, token)).status).toBe(200);
  expect(await prisma.product.findUniqueOrThrow({ where: { id: draft.id } })).toMatchObject({
    deletedAt: expect.any(Date),
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/core-api && bun run test -- tests/products.test.ts`
Expected: FAIL —— 动作路由 404。

- [ ] **Step 3: Implement the four services**

按 Interfaces 中的规则实现，统一使用 `getOwnedProductForWrite(auth, id)`（内部 `findFirst({ where: { id, deletedAt: null }, include: { currentVersion: true } })` + 租户校验）与 `prisma.$transaction`。提交/发布/下线返回 `getProduct(auth, id)`；删除返回 `void`。

- [ ] **Step 4: Register the four routes**

分别用 `createRoute` 注册，全部带 `params: z.object({ id: idSchema })`：

- `submit` / `publish` / `offline` → `requireMerchantPermission(PERMISSIONS.PRODUCT_SUBMIT)` / `Publish` / `Publish`；响应 `{ data: productDetailSchema }`；`409` 描述对应业务错误。
- `delete` → `requireMerchantPermission(PERMISSIONS.PRODUCT_DELETE)`；响应 `{ data: z.null() }`。

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/core-api && bun run test -- tests/products.test.ts`
Expected: PASS（Task 4/5/6 全部用例）。

- [ ] **Step 6: Commit**

```bash
git add apps/core-api/src/services/products.ts apps/core-api/src/routes/products.ts apps/core-api/tests/products.test.ts
git commit -m "feat(core-api): 商品提交、发布、下线与删除"
```

---

### Task 7: 运营端审核

**Files:**

- Create: `apps/core-api/src/services/audits.ts`
- Create: `apps/core-api/src/routes/audits.ts`
- Modify: `apps/core-api/src/app.ts`（注册 `registerAuditRoutes`）
- Test: `apps/core-api/tests/audits.test.ts`

**Interfaces:**

- Consumes: `AuditQuery`、`AuditRecordDTO`、`AuditApproveSchema`、`AuditRejectSchema`；`requireOpsPermission`；`assertMerchantVisible`、`normalizePage`。
- Produces:
  - `listAudits(auth, query): Promise<{ items: AuditRecordDTO[]; meta: PageMeta }>`
  - `getAudit(auth, id): Promise<AuditRecordDTO>`
  - `approveAudit(auth, id, comment?: string): Promise<AuditRecordDTO>`
  - `rejectAudit(auth, id, comment: string): Promise<AuditRecordDTO>`
  - 路由：`GET /api/v1/audits`、`GET /api/v1/audits/{id}`、`POST /api/v1/audits/{id}/approve`、`POST /api/v1/audits/{id}/reject`。

**关键规则：**

- 全部 `requireOpsPermission(PRODUCT_AUDIT)`；按 `merchantScope` 过滤；越权 `403 FORBIDDEN`。
- 决策事务：
  1. 读取审核记录（含版本与商品）；
  2. `tx.auditRecord.updateMany({ where: { id, status: 'PENDING' }, data: { status: next, reviewerId: auth.userId, reviewedAt: now, comment } })`；
  3. `count === 0` → `409 AUDIT_ALREADY_REVIEWED`；
  4. `tx.productVersion.updateMany({ where: { id: productVersionId, status: 'SUBMITTED' }, data: { status: next, reviewedAt: now } })`，`count === 0` → `409 AUDIT_VERSION_CONFLICT`（事务回滚审核记录）。
- 列表默认按 `submittedAt desc`；`keyword` 匹配商品编码或标题；`status` 过滤审核状态。

- [ ] **Step 1: Write the failing tests**

```ts
// apps/core-api/tests/audits.test.ts
import { DEMO_MERCHANT_ID } from '@mtm/contracts';
import { beforeEach, expect, test } from 'vitest';

import { seedCoreData } from '@/prisma/seed-data';
import { createApp } from '@/src/app';
import { prisma } from '@/src/db';

import { merchantToken, opsToken, resetCoreFixtures } from './helpers';

beforeEach(async () => {
  await resetCoreFixtures();
  await seedCoreData(prisma);
});

async function request(path: string, method: string, body: unknown, token: Promise<string>) {
  const headers: Record<string, string> = { authorization: `Bearer ${await token}` };
  if (body !== undefined) headers['content-type'] = 'application/json';
  return createApp().request(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function get(path: string, token: Promise<string>) {
  return request(path, 'GET', undefined, token);
}

async function createSubmittedProduct(code: string): Promise<string> {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:submit']);
  const created = await request(
    '/api/v1/products',
    'POST',
    {
      shopId: 'shop-demo-1',
      code,
      categoryId: 'category-demo-home-sofa',
      brandId: 'brand-demo-1',
      title: `待审商品 ${code}`,
      subtitle: null,
      images: ['data:image/svg+xml;utf8,<svg/>'],
      description: '描述',
      attributes: { 'attr-demo-home-sofa-material': '棉麻' },
      skus: [{ skuCode: `${code}-1`, specs: { 规格: '三人位' }, price: 100, stock: 1 }],
    },
    token
  );
  const detail = (await created.json()).data;
  await request(`/api/v1/products/${detail.id}/submit`, 'POST', undefined, token);
  const audit = await prisma.auditRecord.findFirstOrThrow({ where: { productVersionId: detail.currentVersionId } });
  return audit.id;
}

test('运营审核通过把版本置为 APPROVED', async () => {
  const auditId = await createSubmittedProduct('AUD-1');
  const res = await request(
    `/api/v1/audits/${auditId}/approve`,
    'POST',
    { comment: '通过' },
    opsToken(['product:audit'])
  );

  expect(res.status).toBe(200);
  const audit = (await res.json()).data;
  expect(audit.status).toBe('APPROVED');
  expect(audit.reviewerId).toBe('ops-test');
  expect(audit.product.code).toBe('AUD-1');

  const version = await prisma.productVersion.findUniqueOrThrow({ where: { id: audit.productVersionId } });
  expect(version.status).toBe('APPROVED');
});

test('重复审核返回 409 且状态只变更一次', async () => {
  const auditId = await createSubmittedProduct('AUD-2');
  const token = opsToken(['product:audit']);

  expect((await request(`/api/v1/audits/${auditId}/approve`, 'POST', {}, token)).status).toBe(200);
  const again = await request(`/api/v1/audits/${auditId}/reject`, 'POST', { comment: '驳回' }, token);
  expect(again.status).toBe(409);
  expect(await again.json()).toMatchObject({ error: { code: 'AUDIT_ALREADY_REVIEWED' } });

  const audit = await prisma.auditRecord.findUniqueOrThrow({ where: { id: auditId } });
  expect(audit.status).toBe('APPROVED');
});

test('驳回必须填写原因，填写后版本变为 REJECTED', async () => {
  const auditId = await createSubmittedProduct('AUD-3');
  const token = opsToken(['product:audit']);

  const missing = await request(`/api/v1/audits/${auditId}/reject`, 'POST', {}, token);
  expect(missing.status).toBe(400);

  const res = await request(`/api/v1/audits/${auditId}/reject`, 'POST', { comment: '图片不清晰' }, token);
  expect(res.status).toBe(200);
  expect((await res.json()).data.status).toBe('REJECTED');

  const audit = await prisma.auditRecord.findUniqueOrThrow({ where: { id: auditId } });
  const version = await prisma.productVersion.findUniqueOrThrow({ where: { id: audit.productVersionId } });
  expect(version.status).toBe('REJECTED');
});

test('运营只能看到审核范围内的记录', async () => {
  await createSubmittedProduct('AUD-4');

  const list = await get('/api/v1/audits?status=PENDING', opsToken(['product:audit'], ['merchant-demo-2']));
  const body = await list.json();
  expect(body.meta.total).toBe(0);

  const outOfScope = await get('/api/v1/audits', opsToken(['product:audit'], ['merchant-demo-2']));
  expect(outOfScope.status).toBe(404);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/core-api && bun run test -- tests/audits.test.ts`
Expected: FAIL —— 路由不存在。

- [ ] **Step 3: Implement `services/audits.ts`**

- `auditWhere(auth)`：`status`、`keyword` 与 `merchantScope` 组合（关系过滤 `productVersion: { product: { merchantId: { in } } }`）。
- `toAuditRecord(row, names)`：映射 `product` 字段，日期 `.toISOString()`。
- `getAudit`：`findUnique` + include `productVersion: { include: { product: true } }`；无记录 `404 AUDIT_NOT_FOUND`；范围外 `403 FORBIDDEN`。
- `decide(auth, id, next, comment)`：按关键规则 2 的事务实现；返回 `getAudit(auth, id)`。

- [ ] **Step 4: Implement `routes/audits.ts` and register**

四条路由均带 `middleware: requireOpsPermission(PERMISSIONS.PRODUCT_AUDIT)`；approve 使用 `auditApproveSchema`、reject 使用 `auditRejectSchema`。列表使用 `sendPage`，其余 `sendData`。

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/core-api && bun run test -- tests/audits.test.ts tests/openapi.test.ts`
Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add apps/core-api/src/services/audits.ts apps/core-api/src/routes/audits.ts apps/core-api/src/app.ts apps/core-api/tests/audits.test.ts
git commit -m "feat(core-api): 运营端商品审核"
```

---

### Task 8: 演示商品种子与测试夹具

**Files:**

- Modify: `apps/core-api/prisma/seed-data.ts`
- Test: `apps/core-api/tests/seed.test.ts`（追加断言）

**Interfaces:**

- Produces:
  - `CORE_DATA_SEED_VERSION` 改为 `'2026-11-04-core-products'`。
  - 4 个固定商品：`product-demo-1..4`（`P1001..P1004`），版本固定 ID `pv-demo-1..4`，SKU 固定 ID `sku-demo-*`，审核记录 `audit-demo-2`（`PENDING`）、`audit-demo-3`（`REJECTED` + 驳回原因）。
  - 状态：`product-demo-1` `PUBLISHED`、`product-demo-2` `SUBMITTED`、`product-demo-3` `REJECTED`、`product-demo-4` `DRAFT`；全部归 `merchant-demo-1`，店铺 `shop-demo-1`（`product-demo-4` 用 `shop-demo-2`）。

- [ ] **Step 1: Write the failing seed tests**

在 `apps/core-api/tests/seed.test.ts` 追加：

```ts
test('演示商品可重复写入且状态稳定', async () => {
  await seedCoreData(prisma);
  await seedCoreData(prisma);

  expect(await prisma.product.count()).toBe(4);
  expect(await prisma.productVersion.count()).toBe(4);
  expect(await prisma.sku.count()).toBe(5);
  expect(await prisma.auditRecord.count()).toBe(2);

  const statuses = await prisma.productVersion.findMany({ select: { status: true } });
  expect(statuses.map((item: { status: string }) => item.status).sort()).toEqual([
    'DRAFT',
    'PUBLISHED',
    'REJECTED',
    'SUBMITTED',
  ]);

  const published = await prisma.product.findUniqueOrThrow({
    where: { id: 'product-demo-1' },
    include: { publishedVersion: true },
  });
  expect(published.publishedVersion?.status).toBe('PUBLISHED');

  const pending = await prisma.auditRecord.findFirstOrThrow({ where: { status: 'PENDING' } });
  expect(pending.productVersionId).toBe('pv-demo-2');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/core-api && bun run test -- tests/seed.test.ts`
Expected: FAIL —— `product.count()` 为 0。

- [ ] **Step 3: Add seed data**

在 `seed-data.ts`：

- 把 `CORE_DATA_SEED_VERSION` 改为 `'2026-11-04-core-products'`。
- 定义：

```ts
const DEMO_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23e8eefc"/></svg>';

type ProductSeed = {
  id: string;
  shopId: string;
  categoryId: string;
  brandId: string;
  code: string;
  versionId: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'PUBLISHED';
  title: string;
  attributes: Record<string, string>;
  skus: Array<{ id: string; skuCode: string; specs: Record<string, string>; price: string; stock: number }>;
};

const PRODUCTS: ProductSeed[] = [
  {
    id: 'product-demo-1',
    shopId: 'shop-demo-1',
    categoryId: 'category-demo-home-sofa',
    brandId: 'brand-demo-1',
    code: 'P1001',
    versionId: 'pv-demo-1',
    status: 'PUBLISHED',
    title: '北欧三人位布艺沙发',
    attributes: { 'attr-demo-home-sofa-material': '棉麻', 'attr-demo-home-sofa-size': '三人位 200cm' },
    skus: [
      { id: 'sku-demo-1a', skuCode: 'P1001-A', specs: { 规格: '三人位' }, price: '2599.00', stock: 12 },
      { id: 'sku-demo-1b', skuCode: 'P1001-B', specs: { 规格: '双人位' }, price: '1999.00', stock: 8 },
    ],
  },
  {
    id: 'product-demo-2',
    shopId: 'shop-demo-1',
    categoryId: 'category-demo-digital-smartphone',
    brandId: 'brand-demo-2',
    code: 'P1002',
    versionId: 'pv-demo-2',
    status: 'SUBMITTED',
    title: '星河 5G 智能手机',
    attributes: { 'attr-demo-digital-smartphone-screen': '6.7', 'attr-demo-digital-smartphone-color': '曜石黑' },
    skus: [{ id: 'sku-demo-2a', skuCode: 'P1002-A', specs: { 规格: '8GB+256GB' }, price: '3999.00', stock: 30 }],
  },
  {
    id: 'product-demo-3',
    shopId: 'shop-demo-1',
    categoryId: 'category-demo-food-coffee',
    brandId: 'brand-demo-3',
    code: 'P1003',
    versionId: 'pv-demo-3',
    status: 'REJECTED',
    title: '云岭手冲咖啡豆',
    attributes: {},
    skus: [{ id: 'sku-demo-3a', skuCode: 'P1003-A', specs: { 规格: '250g' }, price: '89.00', stock: 50 }],
  },
  {
    id: 'product-demo-4',
    shopId: 'shop-demo-2',
    categoryId: 'category-demo-fashion-dress',
    brandId: 'brand-demo-4',
    code: 'P1004',
    versionId: 'pv-demo-4',
    status: 'DRAFT',
    title: '夏季碎花连衣裙',
    attributes: {},
    skus: [{ id: 'sku-demo-4a', skuCode: 'P1004-A', specs: { 规格: 'M' }, price: '299.00', stock: 20 }],
  },
];
```

- 在 `seedCoreData` 末尾（`seedMeta.upsert` 之前）写入：
  1. `product.upsert`（固定 ID，不含指针；`update` 更新 `shopId/categoryId/brandId/code`）；
  2. `productVersion.upsert({ where: { id: versionId }, update: { status, title, ... }, create: { id, productId, version: 1, status, title, subtitle: null, mainImageUrl: DEMO_IMAGE, images: [DEMO_IMAGE], description: '演示商品', attributes, createdBy: 'merchant-account-owner', submittedAt/reviewedAt/publishedAt 按状态设置 } })`；
  3. `sku.upsert`（固定 ID）；
  4. `product.update` 写 `currentVersionId`；`product-demo-1` 同时写 `publishedVersionId`；
  5. `auditRecord.upsert`：
     - `audit-demo-2`：`status: 'PENDING'`、`productVersionId: 'pv-demo-2'`、`submitterId: 'merchant-account-owner'`、`submittedAt: new Date('2026-11-04T09:00:00.000Z')`；
     - `audit-demo-3`：`status: 'REJECTED'`、`productVersionId: 'pv-demo-3'`、`submitterId: 'merchant-account-owner'`、`reviewerId: 'ops-demo'`、`comment: '商品描述不完整'`、`reviewedAt: new Date('2026-11-04T10:00:00.000Z')`。

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/core-api && bun run test -- tests/seed.test.ts`
Expected: PASS（3 个用例，含幂等）。

- [ ] **Step 5: Run the full core-api suite**

Run: `cd apps/core-api && bun run test`
Expected: 全部 PASS；如 Task 4-7 用例因种子商品影响计数，改为按 `code`/`id` 精确断言（不得放宽为“至少”）。

- [ ] **Step 6: Commit**

```bash
git add apps/core-api/prisma/seed-data.ts apps/core-api/tests/seed.test.ts
git commit -m "feat(core-api): 演示商品与审核种子"
```

---

### Task 9: 商家端 BFF 透传分页 meta

**Files:**

- Modify: `apps/merchant-admin/lib/api-response.ts`
- Modify: `apps/merchant-admin/lib/core-api.ts`
- Modify: `apps/merchant-admin/lib/api-client.ts`
- Test: `apps/merchant-admin/tests/lib/core-api.test.ts`（追加 meta 用例）

**Interfaces:**

- Consumes: `PageMeta`。
- Produces:
  - `okPage<T>(data, meta): NextResponse<ApiPageSuccess<T>>`。
  - `requestCoreApi<T>(path, init): Promise<CoreApiPayload<T>>`（含 `meta`）。
  - `callCoreApiEnvelope<T>(path, init): Promise<{ data: T; meta: PageMeta | undefined }>`。
  - `proxyToCoreApi` 在 core-api 返回 `meta` 时输出 `{ code: 0, message: 'ok', data, meta }`。
  - `apiFetchWithMeta<T>(path, init): Promise<ApiResult<T>>`；`ApiResult<T> = { data: T; meta: PageMeta | undefined }`。

- [ ] **Step 1: Write the failing test**

在 `apps/merchant-admin/tests/lib/core-api.test.ts` 追加：

```ts
test('proxyToCoreApi 透传分页 meta', async () => {
  fetchMock.mockResolvedValue(jsonResponse(200, { data: [{ id: 'p1' }], meta: { page: 2, pageSize: 10, total: 11 } }));

  const response = await proxyToCoreApi(new Request('http://localhost/api/bff/products?page=2'), ['products']);

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    code: 0,
    message: 'ok',
    data: [{ id: 'p1' }],
    meta: { page: 2, pageSize: 10, total: 11 },
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/merchant-admin && bun run test -- tests/lib/core-api.test.ts`
Expected: FAIL —— 响应缺少 `meta`。

- [ ] **Step 3: Port the ops-admin implementation**

- `lib/api-response.ts`：新增 `ApiPageSuccess<T> extends ApiSuccess<T> { meta: PageMeta }` 与 `okPage`（与 `apps/ops-admin/lib/api-response.ts` 一致）。
- `lib/core-api.ts`：把 `callCoreApi` 拆为 `requestCoreApi` + `callCoreApi` + `callCoreApiEnvelope`；`CoreApiPayload` 增加 `meta?: PageMeta`；`proxyToCoreApi` 改为：

```ts
const { data, meta } = await callCoreApiEnvelope<unknown>(`/${joined}`, { method, body, formData, search });
return meta ? okPage(data, meta) : ok(data);
```

- `lib/api-client.ts`：新增 `meta` 字段与 `ApiResult`、`requestEnvelope`、`apiFetchWithMeta`（与 `apps/ops-admin/lib/api-client.ts` 一致），`apiFetch` 行为不变。

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/merchant-admin && bun run test -- tests/lib/core-api.test.ts`
Expected: PASS（原有用例全部保留）。

- [ ] **Step 5: Commit**

```bash
git add apps/merchant-admin/lib/api-response.ts apps/merchant-admin/lib/core-api.ts apps/merchant-admin/lib/api-client.ts apps/merchant-admin/tests/lib/core-api.test.ts
git commit -m "feat(merchant-admin): BFF 透传分页 meta"
```

---

### Task 10: 商家端商品服务与查询键

**Files:**

- Create: `apps/merchant-admin/lib/services/products.ts`
- Modify: `apps/merchant-admin/lib/query-keys.ts`
- Test: `apps/merchant-admin/tests/lib/services/products.test.ts`

**Interfaces:**

- Consumes: `apiFetch`、`apiFetchWithMeta`、`PageMeta`、`Product*` 契约。
- Produces:
  - `fetchProducts(params): Promise<ApiResult<ProductListRowDTO[]>>`
  - `fetchProduct(id): Promise<ProductDetailDTO>`
  - `createProduct(input): Promise<ProductDetailDTO>`
  - `updateProduct(id, input): Promise<ProductDetailDTO>`
  - `submitProduct(id)`、`publishProduct(id)`、`offlineProduct(id)`、`deleteProduct(id)`
  - `fetchProductCategories(): Promise<CategoryNodeDTO[]>`
  - `fetchProductBrands(): Promise<BrandDTO[]>`
  - `uploadProductImage(file: File): Promise<{ id: string; url: string }>`
  - `queryKeys.products(params)`、`queryKeys.product(id)`、`queryKeys.productCategories`、`queryKeys.productBrands`。

- [ ] **Step 1: Write the failing test**

```ts
// apps/merchant-admin/tests/lib/services/products.test.ts
import { beforeEach, expect, test, vi } from 'vitest';

const { apiFetchMock, apiFetchWithMetaMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  apiFetchWithMetaMock: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: apiFetchMock,
  apiFetchWithMeta: apiFetchWithMetaMock,
}));

import { publishProduct, fetchProducts, submitProduct, uploadProductImage } from '@/lib/services/products';

beforeEach(() => {
  apiFetchMock.mockReset();
  apiFetchWithMetaMock.mockReset();
});

test('商品列表把过滤参数转成 query', async () => {
  apiFetchWithMetaMock.mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, total: 0 } });

  await fetchProducts({ page: 2, pageSize: 10, keyword: '沙发', status: 'DRAFT' });

  expect(apiFetchWithMetaMock).toHaveBeenCalledWith('/api/bff/products', {
    query: { page: 2, pageSize: 10, keyword: '沙发', status: 'DRAFT' },
  });
});

test('提交与发布调用动作端点', async () => {
  apiFetchMock.mockResolvedValue({});

  await submitProduct('p1');
  await publishProduct('p1');

  expect(apiFetchMock).toHaveBeenNthCalledWith(1, '/api/bff/products/p1/submit', { method: 'POST' });
  expect(apiFetchMock).toHaveBeenNthCalledWith(2, '/api/bff/products/p1/publish', { method: 'POST' });
});

test('上传以 multipart 发送并返回 url', async () => {
  apiFetchMock.mockResolvedValue({ id: 'm1', url: '/uploads/x.png' });
  const file = new File(['x'], 'x.png', { type: 'image/png' });
  const form = new FormData();
  form.append('file', file);

  await expect(uploadProductImage(file)).resolves.toEqual({ id: 'm1', url: '/uploads/x.png' });
  expect(apiFetchMock).toHaveBeenCalledWith('/api/bff/uploads/images', { method: 'POST', body: expect.any(FormData) });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/merchant-admin && bun run test -- tests/lib/services/products.test.ts`
Expected: FAIL —— 模块不存在。

- [ ] **Step 3: Implement the service**

按 Interfaces 实现；`deleteProduct` 使用 `apiFetch<null>(path, { method: 'DELETE' })`；`uploadProductImage` 组装 `FormData` 并调用 `/api/bff/uploads/images`。查询键按 `query-keys.ts` 现有注释语义新增。

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/merchant-admin && bun run test -- tests/lib/services/products.test.ts`
Expected: PASS（3 个用例）。

- [ ] **Step 5: Commit**

```bash
git add apps/merchant-admin/lib/services/products.ts apps/merchant-admin/lib/query-keys.ts apps/merchant-admin/tests/lib/services/products.test.ts
git commit -m "feat(merchant-admin): 商品服务与查询键"
```

---

### Task 11: 商家端商品列表与菜单映射

**Files:**

- Create: `apps/merchant-admin/components/product/ProductManager/index.tsx`
- Create: `apps/merchant-admin/components/product/ProductManager/index.module.css`
- Create: `apps/merchant-admin/app/(admin)/products/page.tsx`
- Modify: `apps/merchant-admin/lib/db/seed/auth.ts`
- Modify: `apps/merchant-admin/lib/db/seed/ids.ts`（`MERCHANT_AUTH_SEED_VERSION` → `'2026-11-04-merchant-auth-phase4'`）
- Test: `apps/merchant-admin/tests/components/ProductManager.test.tsx`
- Test: `apps/merchant-admin/tests/lib/db/auth-seed.test.ts`（追加菜单映射断言）

**Interfaces:**

- Consumes: `@/components/ui`（`Button/DataTable/Empty/SearchForm/Field/Input/Select/Tag/useToast`）、`@/components/layout/PageContainer`、`Can`（`@mtm/ui`）、`@/lib/services/products`、`@/lib/query-keys`。
- Produces: 商家端 `/products` 列表；菜单项映射：
  - `/product` → `url: ''`、`title: '商品管理'`、`permissionCode: 'product:view'`；
  - `/product/list` → `url: '/products'`、`title: '商品列表'`、`permissionCode: 'product:view'`；
  - `/product/create` → `url: '/products/new'`、`title: '创建新商品'`、`permissionCode: 'product:create'`。

**列表列：**

- 商品（主图 + 标题）、编码、类目、状态（Tag）、版本、更新时间、操作。
- 操作按状态：`DRAFT/REJECTED/OFFLINE` 显示“编辑”；`SUBMITTED` 显示“审核中”（禁用）；`APPROVED` 显示“发布”；`PUBLISHED` 显示“下线”；`DRAFT` 额外显示“提交审核”；`DRAFT`（非审核中/非发布）显示“删除”。
- 顶部“新建商品”按钮（`product:create`）。
- 过滤器：关键字、状态；分页 `PAGE_SIZE = 10`。

- [ ] **Step 1: Write the failing component test**

```tsx
// apps/merchant-admin/tests/components/ProductManager.test.tsx
import { PERMISSIONS } from '@mtm/contracts';
import { PermissionProvider, ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ apiFetchWithMeta: vi.fn(), apiFetch: vi.fn(), push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn() }),
  usePathname: () => '/products',
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: mocks.apiFetch,
  apiFetchWithMeta: mocks.apiFetchWithMeta,
  ApiError: class ApiError extends Error {
    readonly code = 'ERROR';
    readonly status = 500;
  },
}));

import { ProductManager } from '@/components/product/ProductManager';

const DRAFT_ROW = {
  id: 'p1',
  code: 'P1001',
  title: '测试沙发',
  mainImageUrl: 'data:image/svg+xml;utf8,<svg/>',
  categoryId: 'c1',
  categoryName: '沙发',
  brandId: null,
  brandName: null,
  shopId: 's1',
  shopName: '旗舰店',
  merchantId: 'merchant-demo-1',
  merchantName: '青禾家居有限公司',
  status: 'DRAFT' as const,
  version: 1,
  currentVersionId: 'v1',
  publishedVersionId: null,
  updatedAt: '2026-11-04T00:00:00.000Z',
};

function renderManager() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider permissions={Object.values(PERMISSIONS)}>
          <ProductManager />
        </PermissionProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.apiFetchWithMeta.mockResolvedValue({
    data: [DRAFT_ROW],
    meta: { page: 1, pageSize: 10, total: 1 },
  });
  mocks.apiFetch.mockResolvedValue({});
});

test('渲染商品列表并按状态展示操作', async () => {
  renderManager();

  expect(await screen.findByText('测试沙发')).toBeInTheDocument();
  expect(screen.getByText('草稿')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '提交审核' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '编辑' })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '提交审核' }));
  await waitFor(() => expect(mocks.apiFetch).toHaveBeenCalledWith('/api/bff/products/p1/submit', { method: 'POST' }));
});

test('新建商品跳转到表单页', async () => {
  renderManager();
  await screen.findByText('测试沙发');

  await userEvent.click(screen.getByRole('button', { name: '新建商品' }));
  expect(mocks.push).toHaveBeenCalledWith('/products/new');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/merchant-admin && bun run test -- tests/components/ProductManager.test.tsx`
Expected: FAIL —— 组件不存在。

- [ ] **Step 3: Implement `ProductManager`**

`'use client'`；`useQuery` 使用 `queryKeys.products(params)` 与 `fetchProducts`；`useMutation` 用于 submit/publish/offline/delete，成功/失败用 `useToast`，并 `invalidateQueries({ queryKey: ['products'] })`；状态标签映射：`DRAFT 草稿 / SUBMITTED 审核中 / APPROVED 已通过 / REJECTED 已驳回 / PUBLISHED 已发布 / SUPERSEDED 已被替换 / OFFLINE 已下线`。

- [ ] **Step 4: Add the page**

```tsx
// apps/merchant-admin/app/(admin)/products/page.tsx
import { PERMISSIONS } from '@mtm/contracts';

import { ProductManager } from '@/components/product/ProductManager';
import { requireMerchantPermission } from '@/lib/page-guard';

export default async function ProductsPage() {
  await requireMerchantPermission(PERMISSIONS.PRODUCT_VIEW);

  return <ProductManager />;
}
```

- [ ] **Step 5: Patch the merchant menu seed**

在 `seedMerchantAuth` 末尾追加：

```ts
await tx.menuItem.updateMany({
  where: { url: '/product' },
  data: { url: '', title: '商品管理', permissionCode: PERMISSIONS.PRODUCT_VIEW },
});
await tx.menuItem.updateMany({
  where: { url: '/product/list' },
  data: { url: '/products', title: '商品列表', permissionCode: PERMISSIONS.PRODUCT_VIEW },
});
await tx.menuItem.updateMany({
  where: { url: '/product/create' },
  data: { url: '/products/new', title: '创建新商品', permissionCode: PERMISSIONS.PRODUCT_CREATE },
});
```

并把 `MERCHANT_AUTH_SEED_VERSION` 改为 `'2026-11-04-merchant-auth-phase4'`。

- [ ] **Step 6: Add the seed test assertions**

在 `apps/merchant-admin/tests/lib/db/auth-seed.test.ts` 追加：

```ts
test('商品菜单映射到新路由并挂上权限码', async () => {
  await initDatabase();
  await seedMerchantAuth(prisma);

  const products = await prisma.menuItem.findMany({ where: { id: { in: ['1382', '1383', '19245'] } } });
  const byId = new Map(products.map(item => [item.id, item]));

  expect(byId.get('1382')).toMatchObject({ url: '', title: '商品管理', permissionCode: 'product:view' });
  expect(byId.get('1383')).toMatchObject({ url: '/products', title: '商品列表', permissionCode: 'product:view' });
  expect(byId.get('19245')).toMatchObject({
    url: '/products/new',
    title: '创建新商品',
    permissionCode: 'product:create',
  });
});
```

- [ ] **Step 7: Run tests to verify they pass**

Run:

```bash
cd apps/merchant-admin && bun run test -- tests/components/ProductManager.test.tsx tests/lib/db/auth-seed.test.ts
```

Expected: PASS。

- [ ] **Step 8: Commit**

```bash
git add apps/merchant-admin/components/product/ProductManager apps/merchant-admin/app/\(admin\)/products/page.tsx \
  apps/merchant-admin/lib/db/seed/auth.ts apps/merchant-admin/lib/db/seed/ids.ts \
  apps/merchant-admin/tests/components/ProductManager.test.tsx apps/merchant-admin/tests/lib/db/auth-seed.test.ts
git commit -m "feat(merchant-admin): 商品列表与菜单映射"
```

---

### Task 12: 商家端商品表单（创建 / 编辑 / 状态动作）

**Files:**

- Create: `apps/merchant-admin/components/product/ProductForm/index.tsx`
- Create: `apps/merchant-admin/components/product/ProductForm/index.module.css`
- Create: `apps/merchant-admin/components/product/ProductForm/payload.ts`
- Create: `apps/merchant-admin/components/product/SkuEditor/index.tsx`
- Create: `apps/merchant-admin/components/product/ProductImageField/index.tsx`
- Create: `apps/merchant-admin/components/product/AttributeFields/index.tsx`
- Create: `apps/merchant-admin/app/(admin)/products/new/page.tsx`
- Create: `apps/merchant-admin/app/(admin)/products/[id]/page.tsx`
- Test: `apps/merchant-admin/tests/components/product-payload.test.ts`

**Interfaces:**

- Consumes: `@/components/ui`、`@/components/layout/PageContainer`、`@mtm/ui`（`Can`）、`@/lib/services/products`、契约类型。
- Produces:
  - `buildVersionInput(state: ProductFormState): ProductVersionInput`（纯函数，测试目标）
  - `buildCreateInput(state, shopId, code): ProductCreateInput`
  - `ProductForm({ mode: 'create' } | { mode: 'edit'; productId: string })`
  - 页面：`/products/new`（`product:create`）、`/products/[id]`（`product:view`；无 `product:update` 时只读）。

**表单状态（`ProductFormState`）：**

```ts
interface ProductFormState {
  categoryId: string;
  brandId: string | null;
  title: string;
  subtitle: string;
  images: string[];
  description: string;
  attributes: Record<string, string>;
  skus: Array<{ skuCode: string; specsText: string; price: string; stock: string; status: 'ACTIVE' | 'DISABLED' }>;
}
```

**转换规则：**

- `specsText` → `{ 规格: specsText.trim() }`（空串 → `{}`）。
- `price` → `Number(price)`；`stock` → `Number(stock)`。
- `subtitle` 空串 → `null`；`brandId` 空串 → `null`。
- 过滤 `skuCode` 为空的 SKU 行；至少保留一个。
- `images` 保留顺序，主图即 `images[0]`（服务端计算）。

- [ ] **Step 1: Write the failing payload test**

```ts
// apps/merchant-admin/tests/components/product-payload.test.ts
import { expect, test } from 'vitest';

import { buildCreateInput, buildVersionInput } from '@/components/product/ProductForm/payload';

const STATE = {
  categoryId: 'category-demo-home-sofa',
  brandId: '',
  title: ' 测试沙发 ',
  subtitle: '',
  images: ['data:image/svg+xml;utf8,<svg/>'],
  description: ' 描述 ',
  attributes: { 'attr-demo-home-sofa-material': '棉麻' },
  skus: [{ skuCode: 'P1', specsText: '三人位', price: '2599', stock: '10', status: 'ACTIVE' as const }],
};

test('表单状态转换为版本输入', () => {
  expect(buildVersionInput(STATE)).toEqual({
    categoryId: 'category-demo-home-sofa',
    brandId: null,
    title: '测试沙发',
    subtitle: null,
    images: ['data:image/svg+xml;utf8,<svg/>'],
    description: '描述',
    attributes: { 'attr-demo-home-sofa-material': '棉麻' },
    skus: [{ skuCode: 'P1', specs: { 规格: '三人位' }, price: 2599, stock: 10, status: 'ACTIVE' }],
  });
});

test('创建输入附加 shopId 与 code，并过滤空 SKU 行', () => {
  expect(
    buildCreateInput(
      { ...STATE, skus: [...STATE.skus, { skuCode: '', specsText: '', price: '0', stock: '0', status: 'ACTIVE' }] },
      'shop-demo-1',
      ' P1001 '
    )
  ).toMatchObject({ shopId: 'shop-demo-1', code: 'P1001', skus: [{ skuCode: 'P1' }] });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/merchant-admin && bun run test -- tests/components/product-payload.test.ts`
Expected: FAIL —— 模块不存在。

- [ ] **Step 3: Implement `payload.ts`**

实现 `buildVersionInput` / `buildCreateInput`，严格按转换规则。

- [ ] **Step 4: Implement the form components**

- `ProductImageField`：基于 `Upload`（`maxCount=5`、`accept='image/png,image/jpeg,image/webp'`），`onFilesSelected` 逐个调用 `uploadProductImage`，成功后把 `url` 追加到 `images`；展示缩略图，首个标记“主图”；移除按钮。
- `AttributeFields`：根据选中类目节点（来自 `fetchProductCategories` 的扁平数组）的 `attributes` 渲染；`SELECT` 用 `Select`（选项来自 `options`）、`NUMBER` 用 `Input type='number'`、其余 `Input`；标签显示必填星号；值写入 `attributes[attribute.id]`。
- `SkuEditor`：行编辑 `skuCode / 规格 / 价格 / 库存 / 状态`，支持增删；编辑态回填 `specs` 的第一个值。
- `ProductForm`：
  - 创建模式：额外输入 `shopId`（来自 `/api/bff/merchants/me` 的店铺选择）与 `code`；
  - 编辑模式：`fetchProduct(id)` 回填；`SUBMITTED` 时只读并提示“审核中不可编辑”；
  - 提交按钮：`保存`（create→POST，edit→PATCH）、`提交审核`、`发布`、`下线`，按 `PERMISSIONS` 与当前状态显隐；
  - 成功后 `router.push('/products')` 并刷新列表查询。

- [ ] **Step 5: Add the pages**

```tsx
// apps/merchant-admin/app/(admin)/products/new/page.tsx
import { PERMISSIONS } from '@mtm/contracts';

import { ProductForm } from '@/components/product/ProductForm';
import { requireMerchantPermission } from '@/lib/page-guard';

export default async function NewProductPage() {
  await requireMerchantPermission(PERMISSIONS.PRODUCT_CREATE);
  return <ProductForm mode='create' />;
}
```

```tsx
// apps/merchant-admin/app/(admin)/products/[id]/page.tsx
import { PERMISSIONS } from '@mtm/contracts';

import { ProductForm } from '@/components/product/ProductForm';
import { requireMerchantPermission } from '@/lib/page-guard';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMerchantPermission(PERMISSIONS.PRODUCT_VIEW);
  const { id } = await params;
  return <ProductForm mode='edit' productId={id} />;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd apps/merchant-admin && bun run test -- tests/components/product-payload.test.ts`
Expected: PASS（2 个用例）。

- [ ] **Step 7: Commit**

```bash
git add apps/merchant-admin/components/product apps/merchant-admin/app/\(admin\)/products/new \
  apps/merchant-admin/app/\(admin\)/products/\[id\] apps/merchant-admin/tests/components/product-payload.test.ts
git commit -m "feat(merchant-admin): 商品创建与编辑表单"
```

---

### Task 13: 运营端商品只读列表与详情

**Files:**

- Create: `apps/ops-admin/components/catalog/ProductManager/index.tsx`
- Create: `apps/ops-admin/components/catalog/ProductManager/index.module.css`
- Modify: `apps/ops-admin/app/(dashboard)/products/page.tsx`
- Test: `apps/ops-admin/tests/components/ProductManager.test.tsx`

**Interfaces:**

- Consumes: `@mtm/ui`、`@/lib/api-client`、契约类型。
- Produces: 运营端 `/products` 只读列表 + 详情对话框（当前版本、线上版本、SKU、属性、版本历史）。

**规则：**

- 过滤器：关键字、状态（`PUBLISHED / SUBMITTED / APPROVED` 为主，附“全部”）。
- 列表列：商品（图+标题）、编码、商家、店铺、类目、状态、版本、更新时间、“查看”。
- 详情只读，不出现任何编辑/审核按钮。

- [ ] **Step 1: Write the failing component test**

```tsx
// apps/ops-admin/tests/components/ProductManager.test.tsx
import { PERMISSIONS } from '@mtm/contracts';
import { PermissionProvider, ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ apiFetchWithMeta: vi.fn(), apiFetch: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/products',
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: mocks.apiFetch,
  apiFetchWithMeta: mocks.apiFetchWithMeta,
  ApiError: class ApiError extends Error {
    readonly code = 'ERROR';
    readonly status = 500;
  },
}));

import { ProductManager } from '@/components/catalog/ProductManager';

const ROW = {
  id: 'p1',
  code: 'P1001',
  title: '北欧沙发',
  mainImageUrl: 'data:image/svg+xml;utf8,<svg/>',
  categoryId: 'c1',
  categoryName: '沙发',
  brandId: null,
  brandName: null,
  shopId: 's1',
  shopName: '旗舰店',
  merchantId: 'merchant-demo-1',
  merchantName: '青禾家居有限公司',
  status: 'PUBLISHED' as const,
  version: 1,
  currentVersionId: 'v1',
  publishedVersionId: 'v1',
  updatedAt: '2026-11-04T00:00:00.000Z',
};

const DETAIL = {
  ...ROW,
  currentVersion: {
    id: 'v1',
    version: 1,
    status: 'PUBLISHED',
    title: '北欧沙发',
    subtitle: null,
    mainImageUrl: ROW.mainImageUrl,
    images: [ROW.mainImageUrl],
    description: '舒适',
    attributes: { 'attr-1': '棉麻' },
    createdBy: 'account-1',
    createdAt: ROW.updatedAt,
    submittedAt: ROW.updatedAt,
    reviewedAt: ROW.updatedAt,
    publishedAt: ROW.updatedAt,
    skus: [{ id: 's1', skuCode: 'P1001-A', specs: { 规格: '三人位' }, price: '2599.00', stock: 10, status: 'ACTIVE' }],
  },
  publishedVersion: null,
  versions: [],
};

function renderManager() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider permissions={Object.values(PERMISSIONS)}>
          <ProductManager />
        </PermissionProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.apiFetchWithMeta.mockResolvedValue({ data: [ROW], meta: { page: 1, pageSize: 10, total: 1 } });
  mocks.apiFetch.mockResolvedValue(DETAIL);
});

test('渲染只读列表并可查看详情', async () => {
  renderManager();

  expect(await screen.findByText('北欧沙发')).toBeInTheDocument();
  expect(screen.getByText('已发布')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '编辑' })).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '查看' }));
  expect(await screen.findByText('P1001-A')).toBeInTheDocument();
  expect(screen.getByText('2599.00')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ops-admin && bun run test -- tests/components/ProductManager.test.tsx`
Expected: FAIL —— 组件不存在。

- [ ] **Step 3: Implement the manager and page**

替换 `app/(dashboard)/products/page.tsx` 为：

```tsx
import { PERMISSIONS } from '@mtm/contracts';

import { ProductManager } from '@/components/catalog/ProductManager';
import { requireOpsPermission } from '@/lib/page-guard';

export default async function ProductsPage() {
  await requireOpsPermission(PERMISSIONS.PRODUCT_VIEW);

  return <ProductManager />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ops-admin && bun run test -- tests/components/ProductManager.test.tsx`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add apps/ops-admin/components/catalog/ProductManager apps/ops-admin/app/\(dashboard\)/products/page.tsx apps/ops-admin/tests/components/ProductManager.test.tsx
git commit -m "feat(ops-admin): 商品只读列表与详情"
```

---

### Task 14: 运营端审核列表与决策

**Files:**

- Create: `apps/ops-admin/components/catalog/AuditManager/index.tsx`
- Create: `apps/ops-admin/components/catalog/AuditManager/index.module.css`
- Modify: `apps/ops-admin/app/(dashboard)/audits/page.tsx`
- Test: `apps/ops-admin/tests/components/AuditManager.test.tsx`

**Interfaces:**

- Consumes: `@mtm/ui`、`@/lib/api-client`、`AuditRecordDTO`、`AuditQuery`。
- Produces: 运营端 `/audits` 列表 + 审核详情/决策。

**规则：**

- 默认 `status=PENDING` 过滤；状态标签：`PENDING 待审核 / APPROVED 已通过 / REJECTED 已驳回`。
- 列表列：商品（图+标题）、编码、商家、店铺、类目、版本、提交时间、审核状态、“审核/查看”。
- 详情对话框：展示当前版本主图、描述、SKU、属性；`PENDING` 时显示“通过”与“驳回”按钮。
- 通过：可选备注；调用 `POST /api/bff/audits/{id}/approve`，body `{ comment? }`。
- 驳回：备注必填；调用 `POST /api/bff/audits/{id}/reject`，body `{ comment }`；未填写时前端阻止并提示。
- 决策成功后刷新列表并关闭对话框。

- [ ] **Step 1: Write the failing component test**

```tsx
// apps/ops-admin/tests/components/AuditManager.test.tsx
import { PERMISSIONS } from '@mtm/contracts';
import { PermissionProvider, ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ apiFetchWithMeta: vi.fn(), apiFetch: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/audits',
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: mocks.apiFetch,
  apiFetchWithMeta: mocks.apiFetchWithMeta,
  ApiError: class ApiError extends Error {
    readonly code = 'ERROR';
    readonly status = 500;
  },
}));

import { AuditManager } from '@/components/catalog/AuditManager';

const AUDIT = {
  id: 'a1',
  productVersionId: 'v1',
  status: 'PENDING' as const,
  submitterId: 'm1',
  reviewerId: null,
  comment: null,
  submittedAt: '2026-11-04T09:00:00.000Z',
  reviewedAt: null,
  product: {
    id: 'p1',
    code: 'P1002',
    title: '星河手机',
    mainImageUrl: 'data:image/svg+xml;utf8,<svg/>',
    version: 1,
    merchantId: 'merchant-demo-1',
    merchantName: '青禾家居有限公司',
    shopName: '旗舰店',
    categoryName: '智能手机',
  },
};

function renderManager() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider permissions={Object.values(PERMISSIONS)}>
          <AuditManager />
        </PermissionProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.apiFetchWithMeta.mockResolvedValue({ data: [AUDIT], meta: { page: 1, pageSize: 10, total: 1 } });
  mocks.apiFetch.mockResolvedValue({});
});

test('审核通过调用 approve 端点', async () => {
  renderManager();

  expect(await screen.findByText('星河手机')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: '审核' }));
  await userEvent.click(screen.getByRole('button', { name: '通过' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/bff/audits/a1/approve', {
      method: 'POST',
      body: { comment: undefined },
    })
  );
});

test('驳回必须填写原因', async () => {
  renderManager();

  await userEvent.click(await screen.findByRole('button', { name: '审核' }));
  await userEvent.click(screen.getByRole('button', { name: '驳回' }));

  expect(mocks.apiFetch).not.toHaveBeenCalledWith('/api/bff/audits/a1/reject', expect.anything());
  expect(await screen.findByText('请填写驳回原因')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ops-admin && bun run test -- tests/components/AuditManager.test.tsx`
Expected: FAIL —— 组件不存在。

- [ ] **Step 3: Implement `AuditManager` and page**

替换 `app/(dashboard)/audits/page.tsx`：

```tsx
import { PERMISSIONS } from '@mtm/contracts';

import { AuditManager } from '@/components/catalog/AuditManager';
import { requireOpsPermission } from '@/lib/page-guard';

export default async function AuditsPage() {
  await requireOpsPermission(PERMISSIONS.PRODUCT_AUDIT);

  return <AuditManager />;
}
```

`AuditManager` 使用 `queryKeys ['ops','audits',params]`、`apiFetchWithMeta<AuditRecordDTO[]>('/api/bff/audits', { query: params })`；决策后 `invalidateQueries`。

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ops-admin && bun run test -- tests/components/AuditManager.test.tsx`
Expected: PASS（2 个用例）。

- [ ] **Step 5: Commit**

```bash
git add apps/ops-admin/components/catalog/AuditManager apps/ops-admin/app/\(dashboard\)/audits/page.tsx apps/ops-admin/tests/components/AuditManager.test.tsx
git commit -m "feat(ops-admin): 商品审核列表与决策"
```

---

### Task 15: 文档与全量验证

**Files:**

- Modify: `CLAUDE.md`（当前状态与计划列表）
- Modify: `docs/superpowers/specs/2026-11-03-open-commerce-admin-design.md`（仅在实现偏离设计时补记“阶段 4 实现说明”）

- [ ] **Step 1: Update `CLAUDE.md`**

- “当前状态”追加：阶段 4 已完成（商品/版本/审核）。
- “必读文档”追加阶段 4 计划链接。
- “新会话怎么继续”改为下一步编写并执行阶段 5（i18n / 开源化 / CI）。

- [ ] **Step 2: Run the full verification**

Run:

```bash
bun run typecheck
bun run lint
bun run fmt:check
bun run test
bun run build
```

Expected: 6 个 workspace 全部通过；测试覆盖 `packages/contracts`、`apps/core-api`、`apps/merchant-admin`、`apps/ops-admin`。

- [ ] **Step 3: Fix any drift**

若 `fmt:check` 失败，运行 `bun run fmt`；若类型报错，按报错修正，不得用 `any` / `@ts-ignore` 绕过。

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md docs/superpowers/specs/2026-11-03-open-commerce-admin-design.md
git commit -m "docs: 完成阶段 4 商品/版本/审核"
```

---

## Self-Review

**1. Spec coverage**

- 商品创建/编辑/删除/提交/发布/下线 → Task 4-6、10-12。
- 版本化与已审核版本不可变 → Task 3、5，Review Focus 2。
- 运营端只读与审核 → Task 7、13、14。
- 跨租户与运营范围 → Task 4、7、10（BFF 会话派生）。
- 类目属性用于商品 → Task 2、12。
- 演示数据 → Task 8。
- 权限码（7 个 `product:*`）→ Task 4-7 路由中间件。
- 文档与交付 → Task 15。

**2. Step scan**
每个任务均以“写失败测试 → 运行确认失败 → 实现 → 运行通过 → 提交”为单位；没有“TBD / 处理边界 / 补充测试”这类空步骤。涉及算法或易歧义处（状态机、校验、并发）给出了明确规则与签名。

**3. Type consistency**

- `ProductVersionInput` 在 Task 1 定义，Task 4/5/12 使用同一字段集。
- `assertVersionInput` 在 Task 4 定义，Task 5 复用。
- `ProductListRowDTO` / `ProductDetailDTO` 的字段在 Task 4 映射，Task 10/11/13 消费。
- `ApiResult` 在 Task 9 定义，Task 10 使用。
- `queryKeys.products` 在 Task 10 定义，Task 11 使用。

**4. Review Focus**

- 跨租户：Task 4 的“跨租户读取返回 404，运营范围外返回 403”、Task 5 的“跨租户编辑返回 404”、Task 7 的“运营只能看到审核范围内的记录”。
- 不可变：Task 5 的“已提交商品编辑返回 409”“编辑已驳回版本创建 v2 草稿且保留 v1”。
- 并发审核：Task 7 的“重复审核返回 409 且状态只变更一次”。
- 运营可见性：Task 4 的“商家列表只返回本商家商品，运营只看到已提交/已通过/已发布”。
- 分页/状态过滤：Task 4 的“运营状态过滤作用于当前版本且分页 meta 正确”。

**5. Proportion**
计划中的代码块仅覆盖无法由签名与测试推断的部分：契约定义、并发事务、状态转换与纯函数转换；UI 以组件职责、列定义和交互断言描述，不逐行转写实现。
