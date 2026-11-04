import { expect, test } from 'bun:test';

import { buildDockerEnv } from './docker-env.mjs';

test('does not overwrite an existing env file', () => {
  expect(buildDockerEnv('AUTH_SECRET=keep')).toBe('AUTH_SECRET=keep');
});

test('generates container URLs, random secrets and demo flags', () => {
  const text = buildDockerEnv(null, { RANDOM: () => 'abc123' });
  expect(text).toContain('MERCHANT_DATABASE_URL=postgresql://mtm:mtm@postgres:5432/commerce_merchant?schema=public');
  expect(text).toContain('CORE_API_URL=http://core-api:4000');
  expect(text).toContain('CORE_PUBLIC_URL=http://localhost:4000');
  expect(text).toContain('AUTH_COOKIE_SECURE=false');
  expect(text).toContain('SEED_DEMO_DATA=true');
  expect(text).toContain('AUTH_SECRET=abc123');
});
