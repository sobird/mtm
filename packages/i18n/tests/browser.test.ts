// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';

import { buildLocaleCookie } from '../src';
import { persistLocale } from '../src/browser';

test('builds a one-year SameSite=Lax cookie', () => {
  expect(buildLocaleCookie('en-US')).toBe('NEXT_LOCALE=en-US; Path=/; Max-Age=31536000; SameSite=Lax');
});

test('persists the cookie and reloads the page', () => {
  const reload = vi.fn();
  vi.stubGlobal('location', { reload });
  persistLocale('en-US');
  expect(document.cookie).toContain('NEXT_LOCALE=en-US');
  expect(reload).toHaveBeenCalledTimes(1);
});
