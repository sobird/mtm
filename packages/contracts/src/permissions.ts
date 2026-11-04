export const PERMISSIONS = {
  PRODUCT_VIEW: 'product:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  PRODUCT_SUBMIT: 'product:submit',
  PRODUCT_PUBLISH: 'product:publish',
  PRODUCT_AUDIT: 'product:audit',
  CATEGORY_VIEW: 'category:view',
  CATEGORY_MANAGE: 'category:manage',
  BRAND_MANAGE: 'brand:manage',
  MERCHANT_VIEW: 'merchant:view',
  MERCHANT_UPDATE: 'merchant:update',
  SHOP_VIEW: 'shop:view',
  SHOP_UPDATE: 'shop:update',
  ACCOUNT_MANAGE: 'account:manage',
  ROLE_MANAGE: 'role:manage',
  PLATFORM_CROSS_TENANT: 'platform:cross-tenant',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: readonly PermissionCode[] = Object.values(PERMISSIONS);

export const OPS_PERMISSIONS = [
  PERMISSIONS.PRODUCT_VIEW,
  PERMISSIONS.PRODUCT_AUDIT,
  PERMISSIONS.CATEGORY_VIEW,
  PERMISSIONS.CATEGORY_MANAGE,
  PERMISSIONS.BRAND_MANAGE,
  PERMISSIONS.MERCHANT_VIEW,
  PERMISSIONS.SHOP_VIEW,
  PERMISSIONS.ACCOUNT_MANAGE,
  PERMISSIONS.ROLE_MANAGE,
  PERMISSIONS.PLATFORM_CROSS_TENANT,
] as const satisfies readonly PermissionCode[];

export const MERCHANT_PERMISSIONS = [
  PERMISSIONS.PRODUCT_VIEW,
  PERMISSIONS.PRODUCT_CREATE,
  PERMISSIONS.PRODUCT_UPDATE,
  PERMISSIONS.PRODUCT_DELETE,
  PERMISSIONS.PRODUCT_SUBMIT,
  PERMISSIONS.PRODUCT_PUBLISH,
  PERMISSIONS.MERCHANT_UPDATE,
  PERMISSIONS.SHOP_UPDATE,
  PERMISSIONS.ACCOUNT_MANAGE,
  PERMISSIONS.ROLE_MANAGE,
] as const satisfies readonly PermissionCode[];

export function isOpsPermission(code: string): boolean {
  return (OPS_PERMISSIONS as readonly string[]).includes(code);
}

export function isMerchantPermission(code: string): boolean {
  return (MERCHANT_PERMISSIONS as readonly string[]).includes(code);
}
