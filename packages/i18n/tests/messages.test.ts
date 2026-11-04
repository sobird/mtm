import { describe, expect, test } from 'vitest';

import { createTranslator, getMessages, translateError, translateUiKey } from '../src';

function flatten(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child !== null ? flatten(child as object, `${prefix}${key}.`) : [`${prefix}${key}`]
  );
}

describe('messages', () => {
  test('zh-CN and en-US expose the same key set', () => {
    expect(flatten(getMessages('zh-CN')).sort()).toEqual(flatten(getMessages('en-US')).sort());
  });

  test('translates known keys and errors', () => {
    const t = createTranslator('en-US');
    expect(t('common.logout')).toBe('Sign out');
    expect(translateError('PRODUCT_NOT_FOUND', t)).toBe('Product not found');
    expect(translateError('NOT_A_REAL_CODE', t)).toBe('Something went wrong. Please try again later.');
  });

  test('translates menu keys and leaves business text or missing keys untouched', () => {
    const t = createTranslator('zh-CN');
    expect(translateUiKey('menu.product.list', t)).toBe('商品列表');
    expect(translateUiKey('青禾家居旗舰店', t)).toBe('青禾家居旗舰店');
    expect(translateUiKey('menu.not.seeded', t)).toBe('menu.not.seeded');
  });
});
