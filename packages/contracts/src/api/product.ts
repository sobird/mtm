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

/** 当前版本最近一条审核摘要，供商家端展示驳回原因等。 */
export const productAuditSummarySchema = z.object({
  status: productAuditStatusSchema,
  comment: z.string().nullable(),
  reviewedAt: isoDateTimeSchema.nullable(),
});

export const productDetailSchema = productListRowSchema.extend({
  currentVersion: productVersionSchema,
  publishedVersion: productVersionSchema.nullable(),
  versions: z.array(productVersionSummarySchema),
  latestAudit: productAuditSummarySchema.nullable(),
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
export type ProductAuditSummaryDTO = z.infer<typeof productAuditSummarySchema>;
export type ProductDetailDTO = z.infer<typeof productDetailSchema>;
export type AuditQuery = z.infer<typeof auditQuerySchema>;
export type AuditRecordDTO = z.infer<typeof auditRecordSchema>;
