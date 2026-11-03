import { expect, test } from 'vitest';

import { isMobilePhone } from '@/lib/validation/phone';

test('accepts supported country codes', () => {
  expect(isMobilePhone('13412345678', '86')).toBe(true);
  expect(isMobilePhone('81234567', '65')).toBe(true);
  expect(isMobilePhone('61234567', '852')).toBe(true);
  expect(isMobilePhone('61234567', '853')).toBe(true);
  expect(isMobilePhone('123', '86')).toBe(false);
});

test('rejects unsupported country codes', () => {
  expect(isMobilePhone('13412345678', '1')).toBe(false);
  expect(isMobilePhone('13412345678', '999')).toBe(false);
});

test('supports 886 and rejects malformed numbers', () => {
  expect(isMobilePhone('912345678', '886')).toBe(true);
  expect(isMobilePhone('123456789', '886')).toBe(false);
  expect(isMobilePhone('', '86')).toBe(false);
});
