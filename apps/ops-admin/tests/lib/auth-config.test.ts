import { describe, expect, test } from 'vitest';

import { authConfig } from '@/lib/auth.config';

const redirect = authConfig.callbacks.redirect;

describe('redirect callback', () => {
  test('keeps in-app paths relative', () => {
    expect(redirect({ url: '/login', baseUrl: 'http://0.0.0.0:3001' })).toBe('/login');
    expect(redirect({ url: '/products?pn=2', baseUrl: 'http://0.0.0.0:3001' })).toBe('/products?pn=2');
  });

  test('rejects protocol-relative and backslash paths', () => {
    expect(redirect({ url: '//evil.example/login', baseUrl: 'http://0.0.0.0:3001' })).toBe('/');
    expect(redirect({ url: '/\\evil.example', baseUrl: 'http://0.0.0.0:3001' })).toBe('/');
  });

  test('drops the origin of absolute URLs', () => {
    expect(redirect({ url: 'http://localhost:3001/products', baseUrl: 'http://0.0.0.0:3001' })).toBe('/products');
    expect(redirect({ url: 'https://evil.example/steal', baseUrl: 'http://0.0.0.0:3001' })).toBe('/steal');
  });

  test('falls back to the home page for unparseable input', () => {
    expect(redirect({ url: 'not a url', baseUrl: 'http://0.0.0.0:3001' })).toBe('/');
  });
});

test('uses an explicit ops secret and the ops session cookie', () => {
  expect(authConfig.secret).toBe(process.env.OPS_AUTH_SECRET);
  expect(authConfig.cookies?.sessionToken?.name).toBe(
    process.env.NODE_ENV === 'production' ? '__Secure-ops.session' : 'ops.session'
  );
});

test('writes the ops claims onto the jwt', () => {
  const token = authConfig.callbacks.jwt!({
    token: {},
    user: {
      id: 'ops-account-admin',
      accountId: 'ops-account-admin',
      username: 'admin',
      name: '超级管理员',
      portal: 'ops',
    },
  } as never) as Record<string, unknown>;

  expect(token).toMatchObject({
    sub: 'ops-account-admin',
    accountId: 'ops-account-admin',
    username: 'admin',
    name: '超级管理员',
    portal: 'ops',
  });
});

test('normalizes session claims to strings', () => {
  const session = authConfig.callbacks.session!({
    session: { user: {} },
    token: { sub: '1', accountId: 1, username: 1, name: 'admin', portal: 'ops' },
  } as never);

  expect(session.user?.accountId).toBe('1');
  expect(session.user?.username).toBe('1');
  expect(session.user?.name).toBe('admin');
  expect(session.user?.portal).toBe('ops');
});
