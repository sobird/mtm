import { expect, test } from 'vitest';

import { useSecureCookies } from '../src/cookies';

test('AUTH_COOKIE_SECURE overrides NODE_ENV', () => {
  expect(useSecureCookies({ NODE_ENV: 'production', AUTH_COOKIE_SECURE: 'false' })).toBe(false);
  expect(useSecureCookies({ NODE_ENV: 'development', AUTH_COOKIE_SECURE: 'true' })).toBe(true);
});

test('defaults to NODE_ENV production', () => {
  expect(useSecureCookies({ NODE_ENV: 'production' })).toBe(true);
  expect(useSecureCookies({ NODE_ENV: 'development' })).toBe(false);
  expect(useSecureCookies({ NODE_ENV: 'production', AUTH_COOKIE_SECURE: 'yes' })).toBe(true);
});
