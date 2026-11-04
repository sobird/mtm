import { z } from 'zod';

import { idSchema } from './common';

export const categoryStatusSchema = z.enum(['ACTIVE', 'DISABLED']);

export const attributeTypeSchema = z.enum(['TEXT', 'NUMBER', 'SELECT']);

/**
 * 类目属性输入：SELECT 类型至少需要一个非空选项。
 */
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
      ctx.addIssue({
        code: 'custom',
        message: 'SELECT 类型属性至少需要一个选项',
        path: ['options'],
      });
    }
  });

/**
 * 类目属性输出：带服务端 ID，更新时用它定位并保留属性身份。
 */
export const categoryAttributeSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(50),
  type: attributeTypeSchema,
  required: z.boolean(),
  options: z.array(z.string().trim().min(1).max(50)),
  sort: z.number().int().min(0),
});

/**
 * 创建类目。`level` / `path` 由服务端根据父类目计算，不在输入中出现。
 */
export const categoryCreateSchema = z.object({
  parentId: idSchema.nullable().optional(),
  name: z.string().trim().min(1).max(50),
  sort: z.number().int().min(0).default(0),
  status: categoryStatusSchema.default('ACTIVE'),
  attributes: z.array(categoryAttributeInputSchema).default([]),
});

/**
 * 更新类目。V1 不支持移动父级，因此不包含 `parentId`。
 */
export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  sort: z.number().int().min(0).optional(),
  status: categoryStatusSchema.optional(),
  attributes: z.array(categoryAttributeInputSchema).optional(),
});

/**
 * 类目节点为扁平结构，`/categories/tree` 返回按 `level, path, sort` 排序的扁平数组，
 * 门户按 `level` 缩进展示。
 */
export const categoryNodeSchema = z.object({
  id: idSchema,
  parentId: idSchema.nullable(),
  name: z.string().trim().min(1).max(50),
  level: z.number().int().min(1).max(3),
  path: z.string().min(1).max(1000),
  sort: z.number().int().min(0),
  status: categoryStatusSchema,
  attributes: z.array(categoryAttributeSchema),
});

export type CategoryAttributeInput = z.infer<typeof categoryAttributeInputSchema>;
export type CategoryAttributeDTO = z.infer<typeof categoryAttributeSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type CategoryNodeDTO = z.infer<typeof categoryNodeSchema>;
