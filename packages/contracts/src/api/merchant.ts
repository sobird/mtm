import { z } from 'zod';

import { idSchema, isoDateTimeSchema, paginationQuerySchema } from './common';

export const merchantStatusSchema = z.enum(['ACTIVE', 'DISABLED']);
export const shopStatusSchema = z.enum(['ACTIVE', 'DISABLED']);

/**
 * 商家自维护输入。`id` / `merchantId` 来自会话，不在输入中出现；
 * Zod 默认会剥掉请求体里的未知字段。
 */
export const merchantUpdateSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  contactName: z.string().trim().max(50).nullable().optional(),
  contactPhone: z.string().trim().max(30).nullable().optional(),
});

/**
 * 店铺自维护输入。同样不包含 `id` / `merchantId`；允许空字符串用于清空可选字段。
 */
export const shopUpdateSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  logoUrl: z.string().trim().max(1000).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  externalLink: z.string().trim().max(1000).nullable().optional(),
  address: z.string().trim().max(200).nullable().optional(),
  contactName: z.string().trim().max(50).nullable().optional(),
  contactPhone: z.string().trim().max(30).nullable().optional(),
});

export const merchantQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().trim().max(50).optional(),
  status: merchantStatusSchema.optional(),
});

export const shopQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().trim().max(50).optional(),
  status: shopStatusSchema.optional(),
});

export const merchantSchema = z.object({
  id: idSchema,
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(50),
  status: merchantStatusSchema,
  contactName: z.string().nullable(),
  contactPhone: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const shopSchema = z.object({
  id: idSchema,
  merchantId: idSchema,
  name: z.string().min(1).max(50),
  logoUrl: z.string().nullable(),
  status: shopStatusSchema,
  description: z.string().nullable(),
  externalLink: z.string().nullable(),
  address: z.string().nullable(),
  contactName: z.string().nullable(),
  contactPhone: z.string().nullable(),
  createdAt: isoDateTimeSchema,
});

export const merchantDetailSchema = merchantSchema.extend({
  shops: z.array(shopSchema),
});

export type MerchantUpdateInput = z.infer<typeof merchantUpdateSchema>;
export type ShopUpdateInput = z.infer<typeof shopUpdateSchema>;
export type MerchantQuery = z.infer<typeof merchantQuerySchema>;
export type ShopQuery = z.infer<typeof shopQuerySchema>;
export type MerchantDTO = z.infer<typeof merchantSchema>;
export type ShopDTO = z.infer<typeof shopSchema>;
export type MerchantDetailDTO = z.infer<typeof merchantDetailSchema>;
