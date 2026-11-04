// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';

import {
  PERMISSION_NAME_KEYS,
  buildLocaleCookie,
  createTranslator,
  persistLocale,
  translatePermissionName,
} from '../src';

const PERMISSION_CODES = [
  'product:view',
  'product:create',
  'product:update',
  'product:delete',
  'product:submit',
  'product:publish',
  'product:audit',
  'category:view',
  'category:manage',
  'brand:manage',
  'merchant:view',
  'merchant:update',
  'shop:view',
  'shop:update',
  'account:manage',
  'role:manage',
  'platform:cross-tenant',
];

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = 'NEXT_LOCALE=; Max-Age=0; Path=/';
});

describe('translatePermissionName', () => {
  test('maps all 17 permission codes to permission message keys', () => {
    expect(Object.keys(PERMISSION_NAME_KEYS).sort()).toEqual([...PERMISSION_CODES].sort());
    for (const key of Object.values(PERMISSION_NAME_KEYS)) {
      expect(key.startsWith('permissions.')).toBe(true);
    }
  });

  test('returns the fallback when the code has no message', () => {
    const t = createTranslator('zh-CN');
    expect(translatePermissionName('product:unknown', '未知权限', t)).toBe('未知权限');
    expect(translatePermissionName('product:view', '商品查看', t)).toBe('商品查看');
  });
});

describe('browser helpers', () => {
  test('builds the locale cookie string', () => {
    expect(buildLocaleCookie('en-US')).toBe('NEXT_LOCALE=en-US; Path=/; Max-Age=31536000; SameSite=Lax');
  });

  test('persists the locale cookie and reloads the page', () => {
    const reload = vi.fn();
    vi.stubGlobal('window', { location: { reload } });

    persistLocale('en-US');

    expect(document.cookie).toContain('NEXT_LOCALE=en-US');
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
