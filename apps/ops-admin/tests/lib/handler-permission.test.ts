import { beforeEach, expect, test, vi } from 'vitest';

const { requireOpsAccountMock, getAccountPermissionsMock, initDatabaseMock } = vi.hoisted(() => ({
  requireOpsAccountMock: vi.fn(),
  getAccountPermissionsMock: vi.fn(),
  initDatabaseMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ initDatabase: initDatabaseMock }));
vi.mock('@/lib/auth-guard', () => ({ requireOpsAccount: requireOpsAccountMock }));
vi.mock('@/lib/services/permission', () => ({ getAccountPermissions: getAccountPermissionsMock }));

import { withPermission } from '@/lib/handler';

const ACCOUNT = { accountId: 'ops-account-1', username: 'operator', name: '操作员' };

function snapshot(set: Set<string>) {
  return { codes: [...set], set, isCrossTenant: set.has('platform:cross-tenant'), merchantScope: [] };
}

beforeEach(() => {
  vi.clearAllMocks();
  initDatabaseMock.mockResolvedValue(undefined);
  requireOpsAccountMock.mockResolvedValue(ACCOUNT);
});

test('returns 403 when the account lacks the exact permission', async () => {
  getAccountPermissionsMock.mockResolvedValue(snapshot(new Set(['role:manage'])));

  const handler = vi.fn(async () => ({ ok: true }));
  const route = withPermission('account:manage', handler);

  const response = await route(new Request('http://localhost/api/accounts'));
  const body = await response.json();

  expect(response.status).toBe(403);
  expect(body).toEqual({ code: 'FORBIDDEN', message: '无权访问', data: null });
  expect(handler).not.toHaveBeenCalled();
});

test('does not treat a prefix match as the permission', async () => {
  getAccountPermissionsMock.mockResolvedValue(snapshot(new Set(['account:manage:extra'])));

  const route = withPermission('account:manage', async () => ({ ok: true }));
  const response = await route(new Request('http://localhost/api/accounts'));

  expect(response.status).toBe(403);
});

test('runs the handler with resolved params when permitted', async () => {
  getAccountPermissionsMock.mockResolvedValue(snapshot(new Set(['account:manage'])));

  const route = withPermission('account:manage', async ctx => ({
    accountId: ctx.accountId,
    params: ctx.params,
  }));

  const response = await route(new Request('http://localhost/api/accounts/abc'), {
    params: Promise.resolve({ id: 'abc' }),
  });
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toEqual({ code: 0, message: 'ok', data: { accountId: 'ops-account-1', params: { id: 'abc' } } });
  expect(getAccountPermissionsMock).toHaveBeenCalledWith('ops-account-1');
});

test('rejects cross-site state-changing requests before authentication', async () => {
  getAccountPermissionsMock.mockResolvedValue(snapshot(new Set(['account:manage'])));
  const handler = vi.fn(async () => ({ ok: true }));
  const route = withPermission('account:manage', handler);

  const response = await route(
    new Request('http://localhost/api/accounts', {
      method: 'POST',
      headers: { 'sec-fetch-site': 'cross-site' },
      body: '{}',
    })
  );

  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ code: 'CSRF_FORBIDDEN', message: '跨站请求被拒绝', data: null });
  expect(handler).not.toHaveBeenCalled();
  expect(requireOpsAccountMock).not.toHaveBeenCalled();
});

test('rejects a mismatched origin on state-changing requests', async () => {
  getAccountPermissionsMock.mockResolvedValue(snapshot(new Set(['account:manage'])));
  const route = withPermission('account:manage', async () => ({ ok: true }));

  const response = await route(
    new Request('http://localhost/api/accounts', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
      body: '{}',
    })
  );

  expect(response.status).toBe(403);
  expect(await response.json()).toMatchObject({ code: 'CSRF_FORBIDDEN' });
});

test('allows same-origin and headerless state-changing requests', async () => {
  getAccountPermissionsMock.mockResolvedValue(snapshot(new Set(['account:manage'])));
  const route = withPermission('account:manage', async () => ({ ok: true }));

  const sameOrigin = await route(
    new Request('http://localhost/api/accounts', {
      method: 'POST',
      headers: { 'sec-fetch-site': 'same-origin', origin: 'http://localhost' },
      body: '{}',
    })
  );
  expect(sameOrigin.status).toBe(200);

  const headerless = await route(new Request('http://localhost/api/accounts', { method: 'POST', body: '{}' }));
  expect(headerless.status).toBe(200);
});

test('propagates a 401 from the auth guard', async () => {
  const { AppError } = await import('@/lib/errors');
  requireOpsAccountMock.mockRejectedValue(new AppError('UNAUTHORIZED', 401, '未登录'));

  const route = withPermission('account:manage', async () => ({ ok: true }));
  const response = await route(new Request('http://localhost/api/accounts'));

  expect(response.status).toBe(401);
  expect(getAccountPermissionsMock).not.toHaveBeenCalled();
});
