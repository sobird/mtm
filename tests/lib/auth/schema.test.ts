import { expect, test } from 'vitest';

import { loginSchema, safeCallbackUrl } from '@/lib/validation/auth';

test('validates per country code', () => {
  expect(loginSchema.safeParse({ interCode: '86', mobile: '13412345678', captcha: '123456' }).success).toBe(true);
  expect(loginSchema.safeParse({ interCode: '65', mobile: '81234567', captcha: '123456' }).success).toBe(true);
  expect(loginSchema.safeParse({ interCode: '852', mobile: '61234567', captcha: '123456' }).success).toBe(true);
  expect(loginSchema.safeParse({ interCode: '853', mobile: '61234567', captcha: '123456' }).success).toBe(true);
  expect(loginSchema.safeParse({ interCode: '86', mobile: '123', captcha: '123456' }).success).toBe(false);
});

test('reports the mobile format message', () => {
  const result = loginSchema.safeParse({ interCode: '86', mobile: '123', captcha: '123456' });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues).toContainEqual(
      expect.objectContaining({ path: ['mobile'], message: '手机号格式不符合要求' })
    );
  }
});

test('safeCallbackUrl only allows same-origin paths', () => {
  expect(safeCallbackUrl('/shop')).toBe('/shop');
  expect(safeCallbackUrl('//evil.com')).toBe('/');
  expect(safeCallbackUrl('https://evil.com')).toBe('/');
  expect(safeCallbackUrl('/\\evil.com')).toBe('/');
  expect(safeCallbackUrl(undefined)).toBe('/');
});
