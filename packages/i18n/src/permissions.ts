import type { Translator } from './messages';

export const PERMISSION_NAME_KEYS: Readonly<Record<string, string>> = {
  'product:view': 'permissions.productView',
  'product:create': 'permissions.productCreate',
  'product:update': 'permissions.productUpdate',
  'product:delete': 'permissions.productDelete',
  'product:submit': 'permissions.productSubmit',
  'product:publish': 'permissions.productPublish',
  'product:audit': 'permissions.productAudit',
  'category:view': 'permissions.categoryView',
  'category:manage': 'permissions.categoryManage',
  'brand:manage': 'permissions.brandManage',
  'merchant:view': 'permissions.merchantView',
  'merchant:update': 'permissions.merchantUpdate',
  'shop:view': 'permissions.shopView',
  'shop:update': 'permissions.shopUpdate',
  'account:manage': 'permissions.accountManage',
  'role:manage': 'permissions.roleManage',
  'platform:cross-tenant': 'permissions.platformCrossTenant',
};

export function translatePermissionName(code: string, fallback: string, t: Translator): string {
  const key = PERMISSION_NAME_KEYS[code];
  return key && t.has(key) ? t(key) : fallback;
}
