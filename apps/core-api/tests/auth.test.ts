import { signServiceToken } from '@mtm/auth/service-token';
import { Hono } from 'hono';
import { expect, test, vi } from 'vitest';

import { createApp } from '@/src/app';
import {
  requireAnyPermission,
  requireMerchantPermission,
  requireOpsPermission,
  requirePermission,
  requireServiceToken,
} from '@/src/auth';
import type { AuthVariables } from '@/src/auth';

import { merchantToken, opsToken } from './helpers';

process.env.CORE_API_JWT_SECRET = 'test-core-secret';

const app = createApp();
const secret = 'test-core-secret';
const valid = await signServiceToken(
  { portal: 'ops', userId: 'u1', merchantId: null, permissions: ['merchant:view'], merchantScope: ['m1'] },
  secret
);

async function signWith(permissions: string[]): Promise<string> {
  return signServiceToken(
    { portal: 'ops', userId: 'u1', merchantId: null, permissions, merchantScope: ['m1'] },
    secret
  );
}

test('rejects missing and tampered tokens', async () => {
  expect((await app.request('/api/v1/me')).status).toBe(401);
  expect((await app.request('/api/v1/me', { headers: { authorization: `Bearer ${valid}x` } })).status).toBe(401);
});

test('rejects expired tokens', async () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date());
    const token = await signServiceToken(
      { portal: 'ops', userId: 'u1', merchantId: null, permissions: [], merchantScope: null },
      secret
    );
    vi.setSystemTime(Date.now() + 61_000);

    expect((await app.request('/api/v1/me', { headers: { authorization: `Bearer ${token}` } })).status).toBe(401);
  } finally {
    vi.useRealTimers();
  }
});

test('echoes verified claims', async () => {
  const res = await app.request('/api/v1/me', { headers: { authorization: `Bearer ${valid}` } });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({
    data: { portal: 'ops', userId: 'u1', merchantId: null, permissions: ['merchant:view'], merchantScope: ['m1'] },
  });
});

test('fails closed without a secret', async () => {
  delete process.env.CORE_API_JWT_SECRET;
  expect((await app.request('/api/v1/me', { headers: { authorization: `Bearer ${valid}` } })).status).toBe(500);
  process.env.CORE_API_JWT_SECRET = secret;
});

test('fails closed with the placeholder secret in production', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  process.env.CORE_API_JWT_SECRET = 'change-me-core';

  try {
    const res = await app.request('/api/v1/me', { headers: { authorization: `Bearer ${valid}` } });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: { code: 'CONFIGURATION_ERROR', message: '服务未正确配置', details: null },
    });
  } finally {
    vi.unstubAllEnvs();
    process.env.CORE_API_JWT_SECRET = secret;
  }
});

test('requireOpsPermission checks both portal and permission code', async () => {
  const route = new Hono<{ Variables: AuthVariables }>()
    .use(requireServiceToken)
    .get('/x', requireOpsPermission('category:manage'), c => c.json({ ok: true }));

  const allowed = await route.request('/x', {
    headers: { authorization: `Bearer ${await opsToken(['category:manage'])}` },
  });
  expect(allowed.status).toBe(200);

  const missing = await route.request('/x', {
    headers: { authorization: `Bearer ${await opsToken(['category:view'])}` },
  });
  expect(missing.status).toBe(403);

  const merchant = await route.request('/x', {
    headers: { authorization: `Bearer ${await merchantToken('m1', ['category:manage'])}` },
  });
  expect(merchant.status).toBe(403);
});

test('requireMerchantPermission rejects ops tokens even with the code', async () => {
  const route = new Hono<{ Variables: AuthVariables }>()
    .use(requireServiceToken)
    .get('/x', requireMerchantPermission('product:create'), c => c.json({ ok: true }));

  const allowed = await route.request('/x', {
    headers: { authorization: `Bearer ${await merchantToken('m1', ['product:create'])}` },
  });
  expect(allowed.status).toBe(200);

  const ops = await route.request('/x', {
    headers: { authorization: `Bearer ${await opsToken(['product:create'])}` },
  });
  expect(ops.status).toBe(403);
});

test('requireAnyPermission is portal-agnostic', async () => {
  const route = new Hono<{ Variables: AuthVariables }>()
    .use(requireServiceToken)
    .get('/x', requireAnyPermission(['category:view', 'product:view']), c => c.json({ ok: true }));

  const merchant = await route.request('/x', {
    headers: { authorization: `Bearer ${await merchantToken('m1', ['product:view'])}` },
  });
  expect(merchant.status).toBe(200);

  const denied = await route.request('/x', {
    headers: { authorization: `Bearer ${await opsToken(['merchant:view'])}` },
  });
  expect(denied.status).toBe(403);
});

test('requirePermission returns 403 without the code and 200 with it', async () => {
  const route = new Hono<{ Variables: AuthVariables }>()
    .use(requireServiceToken)
    .get('/x', requirePermission('product:audit'), c => c.json({ ok: true }));

  const denied = await route.request('/x', {
    headers: { authorization: `Bearer ${await signWith(['merchant:view'])}` },
  });
  expect(denied.status).toBe(403);
  expect(await denied.json()).toEqual({ error: { code: 'FORBIDDEN', message: '无权访问', details: null } });

  const allowed = await route.request('/x', {
    headers: { authorization: `Bearer ${await signWith(['product:audit'])}` },
  });
  expect(allowed.status).toBe(200);
  expect(await allowed.json()).toEqual({ ok: true });
});
