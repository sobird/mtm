// @vitest-environment node
import { expect, test } from 'vitest';

import { createCaptcha, verifyCaptcha } from '@/lib/services/captcha';

// NOTE: `createCaptcha`/`verifyCaptcha` are async because `jose`'s sign/verify
// APIs are async. The brief's synchronous sample therefore needs `await`.
test('captcha round-trips and rejects wrong input', async () => {
  const { token, display } = await createCaptcha('13412345678');
  expect(await verifyCaptcha(token, String(display.captcha))).toBe(true);
  expect(await verifyCaptcha(token, '000000')).toBe(false);
  expect(await verifyCaptcha(undefined, String(display.captcha))).toBe(false);
});

test('captcha token contains a 6-digit numeric display value', async () => {
  const { display } = await createCaptcha('13412345678');
  expect(display.mobile).toBe(13412345678);
  expect(Number.isInteger(display.captcha)).toBe(true);
  expect(display.captcha).toBeGreaterThanOrEqual(100000);
  expect(display.captcha).toBeLessThanOrEqual(999999);
});

test('rejects tampered, foreign-secret and malformed tokens', async () => {
  const { token, display } = await createCaptcha('13412345678');

  expect(await verifyCaptcha(`${token}x`, String(display.captcha))).toBe(false);
  expect(await verifyCaptcha('not-a-jwt', String(display.captcha))).toBe(false);

  const { SignJWT } = await import('jose');
  const foreign = await new SignJWT({ mobile: '13412345678', captcha: display.captcha })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(new TextEncoder().encode('a-different-secret'));

  expect(await verifyCaptcha(foreign, String(display.captcha))).toBe(false);
});

test('rejects expired tokens', async () => {
  const { SignJWT } = await import('jose');
  const past = Math.floor(Date.now() / 1000) - 3600;
  const expired = await new SignJWT({ mobile: '13412345678', captcha: '123456' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(past)
    .setExpirationTime(past + 60)
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

  expect(await verifyCaptcha(expired, '123456')).toBe(false);
});
