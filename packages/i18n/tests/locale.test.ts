import { describe, expect, test } from 'vitest';

import { DEFAULT_LOCALE, normalizeLocale } from '../src';

describe('normalizeLocale', () => {
  test('accepts supported locales', () => {
    expect(normalizeLocale('zh-CN')).toBe('zh-CN');
    expect(normalizeLocale('en-US')).toBe('en-US');
  });

  test('falls back to zh-CN for unknown, partial, empty and missing values', () => {
    for (const input of [undefined, null, '', 'en', 'fr-FR', 'EN-us', 'zh']) {
      expect(normalizeLocale(input)).toBe(DEFAULT_LOCALE);
    }
  });
});
