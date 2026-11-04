import { createTranslator } from '@mtm/i18n';
import { expect, test } from 'vitest';

import { createCouponFormSchema } from '@/lib/validation/coupon';

const valid = {
  name: '测试券',
  displayName: '测试展示',
  type: 0,
  target: 1,
  rule: [100, 10],
  stock: 10,
  limit: 1,
  putTerm: [1, 2],
  putCrowd: 1,
  useTerm: [3, [1, 2]],
  useCrowd: 1,
  position: 0,
};

const zh = createCouponFormSchema(createTranslator('zh-CN'));
const en = createCouponFormSchema(createTranslator('en-US'));

test('rejects zero stock and inverted terms', () => {
  expect(zh.safeParse(valid).success).toBe(true);
  expect(en.safeParse(valid).success).toBe(true);
  expect(zh.safeParse({ ...valid, stock: 0 }).success).toBe(false);
  expect(zh.safeParse({ ...valid, putTerm: [2, 1] }).success).toBe(false);
});

test('renders validation messages in the active locale', () => {
  const stockIssue = en.safeParse({ ...valid, stock: 0 }).error?.issues[0]?.message;
  expect(stockIssue).toBe('Stock must be greater than 0.');

  const termIssue = en.safeParse({ ...valid, putTerm: [2, 1] }).error?.issues[0]?.message;
  expect(termIssue).toBe('End time must be later than start time.');

  const zhStockIssue = zh.safeParse({ ...valid, stock: 0 }).error?.issues[0]?.message;
  expect(zhStockIssue).toBe('发放张数必须大于 0');
});
