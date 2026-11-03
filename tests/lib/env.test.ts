import { afterEach, describe, expect, test, vi } from 'vitest';

import { assertProductionSecret } from '@/lib/env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('assertProductionSecret', () => {
  test('does nothing outside production', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('AUTH_SECRET', 'change-me');

    expect(() => assertProductionSecret()).not.toThrow();
  });

  test('rejects the committed placeholder in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_SECRET', 'change-me');

    expect(() => assertProductionSecret()).toThrowError(/strong random value/);
  });

  test('rejects a missing secret in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_SECRET', '');

    expect(() => assertProductionSecret()).toThrowError(/strong random value/);
  });
});
