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
    expect(redirect({ url: '/login', baseUrl: 'http://0.0.0.0:3000' })).toBe('/login');
    expect(redirect({ url: '/market/coupons?pn=2', baseUrl: 'http://0.0.0.0:3000' })).toBe('/market/coupons?pn=2');
  });

  test('rejects protocol-relative and backslash paths', () => {
    expect(redirect({ url: '//evil.example/login', baseUrl: 'http://0.0.0.0:3000' })).toBe('/');
    expect(redirect({ url: '/\\evil.example', baseUrl: 'http://0.0.0.0:3000' })).toBe('/');
  });

  test('drops the origin of absolute URLs', () => {
    expect(redirect({ url: 'http://localhost:3000/market/coupons', baseUrl: 'http://0.0.0.0:3000' })).toBe(
      '/market/coupons'
    );
    expect(redirect({ url: 'https://evil.example/steal', baseUrl: 'http://0.0.0.0:3000' })).toBe('/steal');
  });

  test('falls back to the home page for unparseable input', () => {
    expect(redirect({ url: 'not a url', baseUrl: 'http://0.0.0.0:3000' })).toBe('/');
  });
});

test('uses a portal-scoped session cookie', () => {
  expect(authConfig.cookies?.sessionToken?.name).toBe(
    expectsSecureCookies() ? '__Secure-merchant.session' : 'merchant.session'
  );
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
    expect(config.cookies?.sessionToken?.name).toBe('merchant.session');
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

test('writes the merchant name claim onto the jwt', () => {
  const token = authConfig.callbacks.jwt!({
    token: {},
    user: {
      id: '1',
      accountId: '1',
      merchantId: '1',
      mobile: '13412345678',
      interCode: '86',
      login: 'merchant@example.com',
      name: '演示商家管理员',
    },
  } as never) as Record<string, unknown>;

  expect(token).toMatchObject({
    sub: '1',
    accountId: '1',
    merchantId: '1',
    login: 'merchant@example.com',
    name: '演示商家管理员',
  });
});

test('exposes the merchant name on the session', () => {
  const session = authConfig.callbacks.session!({
    session: { user: {} },
    token: { sub: '1', accountId: '1', merchantId: '1', login: 'merchant@example.com', name: '演示商家管理员' },
  } as never);

  expect(session.user?.name).toBe('演示商家管理员');
});

test('normalizes legacy numeric session ids to strings', async () => {
  const { authConfig: config } = await import('@/lib/auth.config');
  const session = config.callbacks.session!({
    session: { user: {} },
    token: { sub: '1', accountId: 1, merchantId: 1, mobile: '13412345678', interCode: '86', login: 'demo' },
  } as never);
  expect(session.user?.accountId).toBe('1');
  expect(session.user?.merchantId).toBe('1');
});
