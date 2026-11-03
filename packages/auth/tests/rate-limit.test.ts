import { expect, test } from 'vitest';

import { createLoginRateLimiter } from '../src/rate-limit';

test('blocks on the fifth failure within the window', () => {
  const limiter = createLoginRateLimiter({ maxFailures: 5, windowMs: 1000, now: () => 0 });
  for (let i = 0; i < 4; i += 1) limiter.recordFailure('a');
  expect(limiter.isBlocked('a')).toBe(false);
  limiter.recordFailure('a');
  expect(limiter.isBlocked('a')).toBe(true);
  expect(limiter.isBlocked('b')).toBe(false);
});

test('expires failures after the window and resets on success', () => {
  let now = 0;
  const limiter = createLoginRateLimiter({ maxFailures: 2, windowMs: 1000, now: () => now });
  limiter.recordFailure('a');
  limiter.recordFailure('a');
  expect(limiter.isBlocked('a')).toBe(true);
  now = 1001;
  expect(limiter.isBlocked('a')).toBe(false);
  limiter.recordFailure('a');
  limiter.reset('a');
  limiter.recordFailure('a');
  expect(limiter.isBlocked('a')).toBe(false);
});
