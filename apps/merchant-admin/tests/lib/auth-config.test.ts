import { describe, expect, test } from 'vitest';

import { authConfig } from '@/lib/auth.config';

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

test('normalizes legacy numeric session ids to strings', async () => {
  const { authConfig: config } = await import('@/lib/auth.config');
  const session = config.callbacks.session!({
    session: { user: {} },
    token: { sub: '1', accountId: 1, merchantId: 1, mobile: '13412345678', interCode: '86', login: 'demo' },
  } as never);
  expect(session.user?.accountId).toBe('1');
  expect(session.user?.merchantId).toBe('1');
});
