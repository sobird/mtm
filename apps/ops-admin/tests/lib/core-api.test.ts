// @vitest-environment node
import { verifyServiceToken } from '@mtm/auth/service-token';
import { beforeEach, expect, test, vi } from 'vitest';

const { authMock, getAccountPermissionsMock, fetchMock, writeOperationLogMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getAccountPermissionsMock: vi.fn(),
  fetchMock: vi.fn(),
  writeOperationLogMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('@/lib/services/permission', () => ({ getAccountPermissions: getAccountPermissionsMock }));
vi.mock('@/lib/services/operation-log', () => ({ writeOperationLog: writeOperationLogMock }));

import { callCoreApi, proxyToCoreApi } from '@/lib/core-api';
import { AppError } from '@/lib/errors';

const SECRET = 'test-core-secret';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function authorizationHeader(): string {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
  return init.headers.authorization;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  process.env.CORE_API_JWT_SECRET = SECRET;
  process.env.CORE_API_URL = 'http://core.test';
  authMock.mockResolvedValue({
    user: { accountId: 'ops-1', username: 'operator', name: '操作员', portal: 'ops' },
  });
  getAccountPermissionsMock.mockResolvedValue({
    codes: ['merchant:view', 'product:audit'],
    set: new Set(['merchant:view', 'product:audit']),
    isCrossTenant: false,
    merchantScope: ['m1'],
  });
  writeOperationLogMock.mockReset();
  writeOperationLogMock.mockResolvedValue(undefined);
});

test('calls core-api with a signed ops service token and returns data', async () => {
  fetchMock.mockResolvedValue(jsonResponse(200, { data: { ok: true } }));

  const result = await callCoreApi('/me');

  expect(result).toEqual({ ok: true });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
  expect(url).toBe('http://core.test/api/v1/me');
  expect(init.method).toBe('GET');
  expect(init.cache).toBe('no-store');
  expect(init.headers.authorization).toMatch(/^Bearer /);

  const claims = await verifyServiceToken(authorizationHeader().slice('Bearer '.length), SECRET);
  expect(claims).toEqual({
    portal: 'ops',
    userId: 'ops-1',
    merchantId: null,
    permissions: ['merchant:view', 'product:audit'],
    merchantScope: ['m1'],
  });
});

test('forwards the query string and JSON body', async () => {
  fetchMock.mockResolvedValue(jsonResponse(200, { data: [] }));

  await callCoreApi('/products', { method: 'POST', body: { name: 'x' }, search: 'page=1' });

  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
  expect(url).toBe('http://core.test/api/v1/products?page=1');
  expect(init.method).toBe('POST');
  expect(init.headers['content-type']).toBe('application/json');
  expect(init.body).toBe(JSON.stringify({ name: 'x' }));
});

test('multipart 请求以 FormData 转发且不设置 JSON content-type', async () => {
  fetchMock.mockResolvedValue(jsonResponse(200, { data: { id: 'm1', url: '/uploads/x.png' } }));
  const form = new FormData();
  form.append('file', new File(['x'], 'x.png', { type: 'image/png' }));

  const response = await proxyToCoreApi(
    new Request('http://localhost/api/bff/uploads/images', {
      method: 'POST',
      headers: { 'sec-fetch-site': 'same-origin' },
      body: form,
    }),
    ['uploads', 'images']
  );

  expect(response.status).toBe(200);
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
  expect(init.body).toBeInstanceOf(FormData);
  expect(init.headers['content-type']).toBeUndefined();
});

test('rejects oversized declared multipart content-length before forwarding', async () => {
  const response = await proxyToCoreApi(
    new Request('http://localhost/api/bff/uploads/images', {
      method: 'POST',
      headers: {
        'sec-fetch-site': 'same-origin',
        'content-type': 'multipart/form-data; boundary=x',
        'content-length': String(20 * 1024 * 1024),
      },
      body: '--x--',
    }),
    ['uploads', 'images']
  );

  expect(response.status).toBe(413);
  expect(await response.json()).toEqual({ code: 'UPLOAD_TOO_LARGE', message: '上传文件过大', data: null });
  expect(fetchMock).not.toHaveBeenCalled();
});

test('throws the portal AppError preserving the core-api error code', async () => {
  fetchMock.mockResolvedValue(jsonResponse(403, { error: { code: 'FORBIDDEN', message: '无权访问', details: null } }));

  const error = await callCoreApi('/me').catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(AppError);
  expect(error).toMatchObject({ code: 'FORBIDDEN', status: 403, message: '无权访问' });
});

test('rejects unauthenticated calls without hitting core-api', async () => {
  authMock.mockResolvedValue(null);

  const error = await callCoreApi('/me').catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(AppError);
  expect(error).toMatchObject({ code: 'UNAUTHORIZED', status: 401 });
  expect(fetchMock).not.toHaveBeenCalled();
});

test('proxyToCoreApi rejects unauthenticated requests with 401', async () => {
  authMock.mockResolvedValue(null);

  const response = await proxyToCoreApi(new Request('http://localhost/api/bff/me'), ['me']);

  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ code: 'UNAUTHORIZED', message: '未登录', data: null });
  expect(fetchMock).not.toHaveBeenCalled();
});

test('proxyToCoreApi forwards allowed paths and keeps the portal envelope', async () => {
  fetchMock.mockResolvedValue(jsonResponse(200, { data: { portal: 'ops' } }));

  const response = await proxyToCoreApi(new Request('http://localhost/api/bff/me?x=1'), ['me']);

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ code: 0, message: 'ok', data: { portal: 'ops' } });
  expect(fetchMock.mock.calls[0][0]).toBe('http://core.test/api/v1/me?x=1');
});

test('proxyToCoreApi forwards the core-api page meta', async () => {
  const meta = { page: 2, pageSize: 10, total: 15 };
  const data = [{ id: 'brand-demo-1', name: '青禾', logoUrl: null, status: 'ACTIVE' }];
  fetchMock.mockResolvedValue(jsonResponse(200, { data, meta }));

  const response = await proxyToCoreApi(new Request('http://localhost/api/bff/brands?page=2&pageSize=10'), ['brands']);

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ code: 0, message: 'ok', data, meta });
  expect(fetchMock.mock.calls[0][0]).toBe('http://core.test/api/v1/brands?page=2&pageSize=10');
});

test('proxyToCoreApi rejects cross-site state-changing requests', async () => {
  const response = await proxyToCoreApi(
    new Request('http://localhost/api/bff/products', {
      method: 'POST',
      headers: { 'sec-fetch-site': 'cross-site' },
      body: JSON.stringify({ name: 'x' }),
    }),
    ['products']
  );

  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ code: 'CSRF_FORBIDDEN', message: '跨站请求被拒绝', data: null });
  expect(fetchMock).not.toHaveBeenCalled();
});

test('proxyToCoreApi allows same-origin and headerless state-changing requests', async () => {
  fetchMock.mockResolvedValue(jsonResponse(200, { data: { ok: true } }));

  const sameOrigin = await proxyToCoreApi(
    new Request('http://localhost/api/bff/products', {
      method: 'POST',
      headers: { 'sec-fetch-site': 'same-origin', origin: 'http://localhost' },
      body: JSON.stringify({ name: 'x' }),
    }),
    ['products']
  );
  expect(sameOrigin.status).toBe(200);

  const headerless = await proxyToCoreApi(
    new Request('http://localhost/api/bff/products', { method: 'POST', body: JSON.stringify({ name: 'x' }) }),
    ['products']
  );
  expect(headerless.status).toBe(200);
});

test('rejects the placeholder secret in production', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  process.env.CORE_API_JWT_SECRET = 'change-me-core';

  try {
    const error = await callCoreApi('/me').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: 'CONFIGURATION_ERROR', status: 500 });
    expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllEnvs();
    process.env.CORE_API_JWT_SECRET = SECRET;
  }
});

test('maps fetch timeouts to a gateway timeout AppError', async () => {
  fetchMock.mockRejectedValue(Object.assign(new Error('The operation timed out.'), { name: 'TimeoutError' }));

  const error = await callCoreApi('/me').catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(AppError);
  expect(error).toMatchObject({ code: 'CORE_API_TIMEOUT', status: 504 });
});

test('proxyToCoreApi rejects path traversal', async () => {
  const response = await proxyToCoreApi(new Request('http://localhost/api/bff/..%2Fsecret'), ['..', 'secret']);

  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ code: 'INVALID_PATH', message: '路径不合法', data: null });
  expect(fetchMock).not.toHaveBeenCalled();
});

test('writes a portal log after a successful audit action', async () => {
  fetchMock.mockResolvedValue(jsonResponse(200, { data: { id: 'a1', status: 'APPROVED' } }));

  await proxyToCoreApi(
    new Request('http://localhost/api/bff/audits/a1/approve', {
      method: 'POST',
      headers: { 'sec-fetch-site': 'same-origin' },
      body: '{}',
    }),
    ['audits', 'a1', 'approve']
  );

  expect(writeOperationLogMock).toHaveBeenCalledWith(
    expect.objectContaining({
      accountId: 'ops-1',
      action: 'audit.approve',
      resource: 'audit',
      resourceId: 'a1',
    })
  );
});

test('does not write a portal log for read-only requests', async () => {
  fetchMock.mockResolvedValue(jsonResponse(200, { data: [{ id: 'a1' }] }));

  await proxyToCoreApi(new Request('http://localhost/api/bff/audits'), ['audits']);

  expect(writeOperationLogMock).not.toHaveBeenCalled();
});

test('still succeeds when the portal log write fails', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  writeOperationLogMock.mockRejectedValue(new Error('log down'));
  fetchMock.mockResolvedValue(jsonResponse(200, { data: { id: 'a1', status: 'APPROVED' } }));

  try {
    const response = await proxyToCoreApi(
      new Request('http://localhost/api/bff/audits/a1/approve', {
        method: 'POST',
        headers: { 'sec-fetch-site': 'same-origin' },
        body: '{}',
      }),
      ['audits', 'a1', 'approve']
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ code: 0, message: 'ok', data: { id: 'a1', status: 'APPROVED' } });
    expect(consoleError).toHaveBeenCalled();
  } finally {
    consoleError.mockRestore();
  }
});
