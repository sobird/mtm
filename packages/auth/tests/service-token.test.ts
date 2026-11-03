import { SignJWT } from 'jose';
import { afterEach, expect, test, vi } from 'vitest';

import {
  SERVICE_TOKEN_AUDIENCE,
  SERVICE_TOKEN_ISSUER,
  signServiceToken,
  verifyServiceToken,
} from '../src/service-token';

const claims = {
  portal: 'ops' as const,
  userId: 'u1',
  merchantId: null,
  permissions: ['merchant:view'],
  merchantScope: ['m1'],
};

afterEach(() => vi.useRealTimers());

test('round-trips claims', async () => {
  const token = await signServiceToken(claims, 'secret');
  await expect(verifyServiceToken(token, 'secret')).resolves.toMatchObject(claims);
});

test('returns only service token claims', async () => {
  const token = await signServiceToken(claims, 'secret');
  const verified = await verifyServiceToken(token, 'secret');
  expect(Object.keys(verified).sort()).toEqual(['merchantId', 'merchantScope', 'permissions', 'portal', 'userId']);
});

test('rejects expiry, tampering and wrong secrets', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  const token = await signServiceToken(claims, 'secret');
  vi.setSystemTime(new Date('2026-01-01T00:01:01Z'));
  await expect(verifyServiceToken(token, 'secret')).rejects.toThrow();
  vi.useRealTimers();

  const fresh = await signServiceToken(claims, 'secret');
  await expect(verifyServiceToken(`${fresh}x`, 'secret')).rejects.toThrow();
  await expect(verifyServiceToken(fresh, 'other')).rejects.toThrow();
});

test('rejects malformed claims', async () => {
  const token = await signServiceToken({ ...claims, portal: 'admin' as never }, 'secret');
  await expect(verifyServiceToken(token, 'secret')).rejects.toThrow();
});

test('rejects a correctly signed token without exp', async () => {
  const token = await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(SERVICE_TOKEN_ISSUER)
    .setAudience(SERVICE_TOKEN_AUDIENCE)
    .setIssuedAt()
    .sign(new TextEncoder().encode('secret'));

  await expect(verifyServiceToken(token, 'secret')).rejects.toThrow();
});
