import { expect, test } from 'vitest';

import { couponFormSchema } from '@/lib/validation/coupon';

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

test('rejects zero stock and inverted terms', () => {
  expect(couponFormSchema.safeParse(valid).success).toBe(true);
  expect(couponFormSchema.safeParse({ ...valid, stock: 0 }).success).toBe(false);
  expect(couponFormSchema.safeParse({ ...valid, putTerm: [2, 1] }).success).toBe(false);
});
