import { createTranslator } from '@mtm/i18n';
import { expect, test } from 'vitest';

import { createLoginSchema, createRegisterSchema, loginSchema, safeCallbackUrl } from '@/lib/validation/auth';

const en = createTranslator('en-US');

test('validates per country code', () => {
  const loginSchemaEn = createLoginSchema(en);

  expect(loginSchemaEn.safeParse({ interCode: '86', mobile: '13412345678', captcha: '123456' }).success).toBe(true);
  expect(loginSchemaEn.safeParse({ interCode: '65', mobile: '81234567', captcha: '123456' }).success).toBe(true);
  expect(loginSchemaEn.safeParse({ interCode: '852', mobile: '61234567', captcha: '123456' }).success).toBe(true);
  expect(loginSchemaEn.safeParse({ interCode: '853', mobile: '61234567', captcha: '123456' }).success).toBe(true);
  expect(loginSchemaEn.safeParse({ interCode: '86', mobile: '123', captcha: '123456' }).success).toBe(false);
});

test('reports the mobile format message in the active locale', () => {
  const result = createLoginSchema(en).safeParse({ interCode: '86', mobile: '123', captcha: '123456' });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues).toContainEqual(
      expect.objectContaining({ path: ['mobile'], message: 'Invalid mobile number format.' })
    );
  }
});

test('the default schema keeps the default-locale messages', () => {
  const result = loginSchema.safeParse({ interCode: '86', mobile: '123', captcha: '123456' });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues).toContainEqual(
      expect.objectContaining({ path: ['mobile'], message: '手机号格式不符合要求' })
    );
  }
});

test('register requires the privacy policy in the active locale', () => {
  const result = createRegisterSchema(en).safeParse({
    interCode: '86',
    mobile: '13412345678',
    captcha: '123456',
    policy: false,
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues).toContainEqual(
      expect.objectContaining({ path: ['policy'], message: 'Please accept the privacy policy.' })
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
