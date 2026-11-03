import { describe, expect, test } from 'vitest';

import {
  ALL_PERMISSIONS,
  MERCHANT_PERMISSIONS,
  OPS_PERMISSIONS,
  PERMISSIONS,
  isMerchantPermission,
  isOpsPermission,
} from '../src/permissions';

describe('permission catalogue', () => {
  test('codes are unique', () => {
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
  });

  test('ops never gets merchant write codes', () => {
    expect(OPS_PERMISSIONS).not.toContain(PERMISSIONS.PRODUCT_CREATE);
    expect(OPS_PERMISSIONS).not.toContain(PERMISSIONS.PRODUCT_UPDATE);
    expect(OPS_PERMISSIONS).not.toContain(PERMISSIONS.PRODUCT_DELETE);
    expect(OPS_PERMISSIONS).not.toContain(PERMISSIONS.PRODUCT_SUBMIT);
    expect(OPS_PERMISSIONS).not.toContain(PERMISSIONS.PRODUCT_PUBLISH);
    expect(OPS_PERMISSIONS).toContain(PERMISSIONS.PRODUCT_AUDIT);
    expect(OPS_PERMISSIONS).toContain(PERMISSIONS.PLATFORM_CROSS_TENANT);
  });

  test('merchant never gets audit or category/brand management', () => {
    expect(MERCHANT_PERMISSIONS).not.toContain(PERMISSIONS.PRODUCT_AUDIT);
    expect(MERCHANT_PERMISSIONS).not.toContain(PERMISSIONS.CATEGORY_MANAGE);
    expect(MERCHANT_PERMISSIONS).not.toContain(PERMISSIONS.BRAND_MANAGE);
    expect(MERCHANT_PERMISSIONS).toContain(PERMISSIONS.PRODUCT_PUBLISH);
  });

  test('guards reject unknown codes', () => {
    expect(isOpsPermission('product:audit')).toBe(true);
    expect(isOpsPermission('product:create')).toBe(false);
    expect(isMerchantPermission('account:manage')).toBe(true);
    expect(isMerchantPermission('product:audit')).toBe(false);
  });
});
