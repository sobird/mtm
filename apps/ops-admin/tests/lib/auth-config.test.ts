import { describe, expect, test, vi } from 'vitest';

import { authConfig } from '@/lib/auth.config';

function expectsSecureCookies(): boolean {
  if (process.env.AUTH_COOKIE_SECURE === 'true') return true;
  if (process.env.AUTH_COOKIE_SECURE === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

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
  expect(authConfig.cookies?.sessionToken?.name).toBe(expectsSecureCookies() ? '__Secure-ops.session' : 'ops.session');
});

test('disables secure cookies when AUTH_COOKIE_SECURE=false', async () => {
  const env = process.env as Record<string, string | undefined>;
  const originalNodeEnv = env.NODE_ENV;
  const originalFlag = env.AUTH_COOKIE_SECURE;

  try {
    env.NODE_ENV = 'production';
    env.AUTH_COOKIE_SECURE = 'false';
    vi.resetModules();

    const { authConfig: config } = await import('@/lib/auth.config');

    expect(config.useSecureCookies).toBe(false);
    expect(config.cookies?.sessionToken?.name).toBe('ops.session');
    expect(config.cookies?.sessionToken?.options?.secure).toBe(false);
  } finally {
    env.NODE_ENV = originalNodeEnv;
    if (originalFlag === undefined) {
      delete env.AUTH_COOKIE_SECURE;
    } else {
      env.AUTH_COOKIE_SECURE = originalFlag;
    }
    vi.resetModules();
  }
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
