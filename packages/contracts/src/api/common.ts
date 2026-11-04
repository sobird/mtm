import { z } from 'zod';

/**
 * 业务主键：cuid 或固定种子 ID，只允许字母、数字、下划线与连字符。
 */
export const idSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'ID 只能包含字母、数字、下划线和连字符');

/**
 * 统一错误包络：`{ error: { code, message, details } }`。
 */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().nullable(),
  }),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const pageMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
});

export function pageSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    meta: pageMetaSchema,
  });
}

export const isoDateTimeSchema = z.iso.datetime();

export type ApiError = z.infer<typeof apiErrorSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type PageMeta = z.infer<typeof pageMetaSchema>;
export type Page<T> = { data: T[]; meta: PageMeta };
