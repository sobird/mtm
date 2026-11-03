import { z } from 'zod';

import { idSchema, paginationQuerySchema } from './common';

export const brandStatusSchema = z.enum(['ACTIVE', 'DISABLED']);

const brandNameSchema = z.string().trim().min(1).max(50);
const brandLogoUrlSchema = z.string().trim().min(1).max(1000).nullable();

export const brandCreateSchema = z.object({
  name: brandNameSchema,
  logoUrl: brandLogoUrlSchema.optional(),
  status: brandStatusSchema.default('ACTIVE'),
});

export const brandUpdateSchema = z.object({
  name: brandNameSchema.optional(),
  logoUrl: brandLogoUrlSchema.optional(),
  status: brandStatusSchema.optional(),
});

export const brandQuerySchema = paginationQuerySchema.extend({
  keyword: z.string().trim().max(50).optional(),
  status: brandStatusSchema.optional(),
});

export const brandSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(50),
  logoUrl: z.string().nullable(),
  status: brandStatusSchema,
});

export type BrandCreateInput = z.infer<typeof brandCreateSchema>;
export type BrandUpdateInput = z.infer<typeof brandUpdateSchema>;
export type BrandQuery = z.infer<typeof brandQuerySchema>;
export type BrandDTO = z.infer<typeof brandSchema>;
