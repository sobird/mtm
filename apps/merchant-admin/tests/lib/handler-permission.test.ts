import { beforeEach, expect, test, vi } from 'vitest';

const { requireAccountMock, getAccountPermissionsMock, initDatabaseMock } = vi.hoisted(() => ({
  requireAccountMock: vi.fn(),
  getAccountPermissionsMock: vi.fn(),
  initDatabaseMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ initDatabase: initDatabaseMock }));
vi.mock('@/lib/auth-guard', () => ({ requireAccount: requireAccountMock }));
vi.mock('@/lib/services/permission', () => ({ getAccountPermissions: getAccountPermissionsMock }));

import { withPermission } from '@/lib/handler';

const ACCOUNT = { accountId: 'merchant-account-1', merchantId: '1' };

function snapshot(set: Set<string>) {
  return { codes: [...set], set, isOwner: set.has('account:manage') };
}

beforeEach(() => {
  vi.clearAllMocks();
  initDatabaseMock.mockResolvedValue(undefined);
  requireAccountMock.mockResolvedValue(ACCOUNT);
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

test('runs the handler with merchant context and resolved params when permitted', async () => {
  getAccountPermissionsMock.mockResolvedValue(snapshot(new Set(['account:manage'])));

  const route = withPermission('account:manage', async ctx => ({
    accountId: ctx.accountId,
    merchantId: ctx.merchantId,
    permissions: ctx.permissions.codes,
    params: ctx.params,
  }));

  const response = await route(new Request('http://localhost/api/accounts/abc'), {
    params: Promise.resolve({ id: 'abc' }),
  });
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toEqual({
    code: 0,
    message: 'ok',
    data: {
      accountId: 'merchant-account-1',
      merchantId: '1',
      permissions: ['account:manage'],
      params: { id: 'abc' },
    },
  });
  expect(getAccountPermissionsMock).toHaveBeenCalledWith('merchant-account-1');
});

test('propagates a 401 from the auth guard', async () => {
  const { AppError } = await import('@/lib/errors');
  requireAccountMock.mockRejectedValue(new AppError('UNAUTHORIZED', 401, '未登录'));

  const route = withPermission('account:manage', async () => ({ ok: true }));
  const response = await route(new Request('http://localhost/api/accounts'));

  expect(response.status).toBe(401);
  expect(getAccountPermissionsMock).not.toHaveBeenCalled();
});
