import { z } from 'zod';

const namePattern = /^[a-zA-Z0-9._@-]{3,64}$/;

// Seeded rows use fixed non-cuid identifiers (e.g. `ops-role-super-admin`), so
// IDs are validated by shape rather than by `z.cuid()`.
const idSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'ID 格式不合法');

export const accountStatusSchema = z.enum(['ACTIVE', 'DISABLED']);

export const accountListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  keyword: z.string().trim().min(1).optional(),
  status: accountStatusSchema.optional(),
});

export const accountCreateSchema = z.object({
  username: z.string().regex(namePattern, '用户名格式不合法'),
  name: z.string().min(1, '姓名不能为空').max(50, '姓名不得超过 50 个字符'),
  password: z.string().min(8, '密码至少 8 位').max(128, '密码不得超过 128 位'),
  roleIds: z.array(idSchema),
});

export const accountUpdateSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名不得超过 50 个字符').optional(),
  status: accountStatusSchema.optional(),
  roleIds: z.array(idSchema).optional(),
});

export const accountPasswordSchema = z.object({
  password: z.string().min(8, '密码至少 8 位').max(128, '密码不得超过 128 位'),
});

export const roleCreateSchema = z.object({
  code: z.string().regex(namePattern, '角色编码格式不合法'),
  name: z.string().min(1, '名称不能为空').max(50, '名称不得超过 50 个字符'),
  permissionCodes: z.array(z.string()),
  merchantScope: z.array(z.string()),
});

// `code` is immutable after creation, so the update schema intentionally omits it.
export const roleUpdateSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50, '名称不得超过 50 个字符').optional(),
  permissionCodes: z.array(z.string()).optional(),
  merchantScope: z.array(z.string()).optional(),
});

export type AccountListQuery = z.output<typeof accountListQuerySchema>;
export type AccountCreateInput = z.output<typeof accountCreateSchema>;
export type AccountUpdateInput = z.output<typeof accountUpdateSchema>;
export type RoleCreateInput = z.output<typeof roleCreateSchema>;
export type RoleUpdateInput = z.output<typeof roleUpdateSchema>;
