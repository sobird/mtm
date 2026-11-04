import { DEFAULT_LOCALE, createTranslator, type Translate } from '@mtm/i18n';
import { z } from 'zod';

const namePattern = /^[a-zA-Z0-9._@-]{3,64}$/;

// Seeded rows use fixed non-cuid identifiers (e.g. `ops-role-super-admin`), so
// IDs are validated by shape rather than by `z.cuid()`.
function createIdSchema(t: Translate) {
  return z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, t('validation.idInvalid'));
}

export const accountStatusSchema = z.enum(['ACTIVE', 'DISABLED']);

export const accountListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  keyword: z.string().trim().min(1).optional(),
  status: accountStatusSchema.optional(),
});

export function createAccountCreateSchema(t: Translate) {
  return z.object({
    username: z.string().regex(namePattern, t('validation.usernameInvalid')),
    name: z.string().min(1, t('validation.nameRequired')).max(50, t('validation.nameMax')),
    password: z.string().min(8, t('validation.passwordMin')).max(128, t('validation.passwordMax')),
    roleIds: z.array(createIdSchema(t)),
  });
}

export function createAccountUpdateSchema(t: Translate) {
  return z.object({
    name: z.string().min(1, t('validation.nameRequired')).max(50, t('validation.nameMax')).optional(),
    status: accountStatusSchema.optional(),
    roleIds: z.array(createIdSchema(t)).optional(),
  });
}

export function createAccountPasswordSchema(t: Translate) {
  return z.object({
    password: z.string().min(8, t('validation.passwordMin')).max(128, t('validation.passwordMax')),
  });
}

export function createRoleCreateSchema(t: Translate) {
  return z.object({
    code: z.string().regex(namePattern, t('validation.roleCodeInvalid')),
    name: z.string().min(1, t('validation.nameRequired')).max(50, t('validation.nameMax')),
    permissionCodes: z.array(z.string()),
    merchantScope: z.array(z.string()),
  });
}

// `code` is immutable after creation, so the update schema intentionally omits it.
export function createRoleUpdateSchema(t: Translate) {
  return z.object({
    name: z.string().min(1, t('validation.nameRequired')).max(50, t('validation.nameMax')).optional(),
    permissionCodes: z.array(z.string()).optional(),
    merchantScope: z.array(z.string()).optional(),
  });
}

// Server-side defaults for API routes that do not render validation text.
const defaultTranslate = createTranslator(DEFAULT_LOCALE);

export const accountCreateSchema = createAccountCreateSchema(defaultTranslate);
export const accountUpdateSchema = createAccountUpdateSchema(defaultTranslate);
export const accountPasswordSchema = createAccountPasswordSchema(defaultTranslate);
export const roleCreateSchema = createRoleCreateSchema(defaultTranslate);
export const roleUpdateSchema = createRoleUpdateSchema(defaultTranslate);

export type AccountListQuery = z.output<typeof accountListQuerySchema>;
export type AccountCreateInput = z.output<typeof accountCreateSchema>;
export type AccountUpdateInput = z.output<typeof accountUpdateSchema>;
export type RoleCreateInput = z.output<typeof roleCreateSchema>;
export type RoleUpdateInput = z.output<typeof roleUpdateSchema>;
