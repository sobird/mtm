import { createRoute, z } from '@hono/zod-openapi';
import type { ServiceTokenClaims } from '@mtm/auth/service-token';
import { expect, test } from 'vitest';

import { createApp } from '@/src/app';
import { assertMerchantVisible, canAccessMerchant, HttpError, normalizePage } from '@/src/http';

import { merchantToken, opsToken } from './helpers';

function claims(overrides: Partial<ServiceTokenClaims>): ServiceTokenClaims {
  return {
    portal: 'ops',
    userId: 'u1',
    merchantId: null,
    permissions: [],
    merchantScope: null,
    ...overrides,
  };
}

test('未知路由之外的校验失败返回统一错误包络', async () => {
  const app = createApp();
  const res = await app.request('/api/v1/me', { headers: { authorization: 'Bearer bad' } });
  expect(res.status).toBe(401);
  expect(await res.json()).toEqual({ error: { code: 'UNAUTHORIZED', message: '未授权', details: null } });
});

test('导出 OpenAPI 文档且包含服务鉴权方案', async () => {
  const res = await createApp().request('/openapi.json');
  expect(res.status).toBe(200);
  const doc = (await res.json()) as {
    paths: Record<string, unknown>;
    components: { securitySchemes: Record<string, unknown> };
  };
  expect(doc.paths['/api/v1/me']).toBeTruthy();
  expect(doc.components.securitySchemes.bearerAuth).toMatchObject({ type: 'http', scheme: 'bearer' });
});

test('分页默认值与上限', () => {
  expect(normalizePage({})).toEqual({ page: 1, pageSize: 20, skip: 0, take: 20 });
  expect(normalizePage({ page: 3, pageSize: 500 })).toEqual({ page: 3, pageSize: 100, skip: 200, take: 100 });
});

test('分页下限会被夹取到 1', () => {
  expect(normalizePage({ page: 0, pageSize: 0 })).toEqual({ page: 1, pageSize: 1, skip: 0, take: 1 });
});

test('/api/v1 下新注册的路由仍受服务令牌保护', async () => {
  const app = createApp();
  app.get('/api/v1/late-route', c => c.json({ data: 'ok' }));
  expect((await app.request('/api/v1/late-route')).status).toBe(401);
});

test('参数校验失败返回 400 INVALID_REQUEST 且 details 可序列化', async () => {
  const app = createApp();
  const route = createRoute({
    method: 'get',
    path: '/api/v1/validated',
    request: { query: z.object({ page: z.coerce.number().int().min(2) }) },
    responses: {
      200: {
        description: 'ok',
        content: { 'application/json': { schema: z.object({ data: z.object({ page: z.number() }) }) } },
      },
    },
  });

  app.openapi(route, c => c.json({ data: c.req.valid('query') }, 200));

  const res = await app.request('/api/v1/validated?page=1', {
    headers: { authorization: `Bearer ${await opsToken([])}` },
  });
  expect(res.status).toBe(400);
  const body = (await res.json()) as { error: { code: string; message: string; details: unknown } };
  expect(body.error.code).toBe('INVALID_REQUEST');
  expect(body.error.message).toBe('请求参数不合法');
  expect(Array.isArray(body.error.details)).toBe(true);
});

test('canAccessMerchant 对商家令牌只允许自身', () => {
  const merchant = claims({ portal: 'merchant', merchantId: 'm1' });
  expect(canAccessMerchant(merchant, 'm1')).toBe(true);
  expect(canAccessMerchant(merchant, 'm2')).toBe(false);
});

test('canAccessMerchant 对运营令牌按跨租户权限与商家范围判断', () => {
  expect(canAccessMerchant(claims({ merchantScope: null }), 'm1')).toBe(true);
  expect(canAccessMerchant(claims({ permissions: ['platform:cross-tenant'], merchantScope: ['m2'] }), 'm1')).toBe(true);
  expect(canAccessMerchant(claims({ merchantScope: ['m1'] }), 'm1')).toBe(true);
  expect(canAccessMerchant(claims({ merchantScope: ['m2'] }), 'm1')).toBe(false);
});

test('assertMerchantVisible 越权时抛出 403 HttpError', () => {
  expect(() => assertMerchantVisible(claims({ merchantScope: ['m2'] }), 'm1')).toThrowError(HttpError);

  try {
    assertMerchantVisible(claims({ merchantScope: ['m2'] }), 'm1');
  } catch (error) {
    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(403);
    expect((error as HttpError).code).toBe('FORBIDDEN');
  }
});

test('merchantToken 辅助函数签发商家令牌', async () => {
  const res = await createApp().request('/api/v1/me', {
    headers: { authorization: `Bearer ${await merchantToken('m1', ['product:view'])}` },
  });
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ data: { portal: 'merchant', merchantId: 'm1' } });
});
