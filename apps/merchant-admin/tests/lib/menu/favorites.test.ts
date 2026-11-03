import { expect, test } from 'vitest';

import { toggleFavorite } from '@/lib/menu/favorites';

const item = (id: string) => ({ id }) as never;

test('adds, removes, and caps favorites', () => {
  expect(toggleFavorite([], item('1'))).toHaveLength(1);
  expect(toggleFavorite([item('1')], item('1'))).toHaveLength(0);
  const ten = Array.from({ length: 10 }, (_, i) => item(String(i)));
  expect(() => toggleFavorite(ten, item('x'))).toThrow();
});
