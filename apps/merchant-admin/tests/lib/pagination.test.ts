import { describe, expect, test } from 'vitest';

import { normalizePagination } from '@/lib/pagination';

describe('normalizePagination', () => {
  test('defaults to page 1 and size 10', () => {
    expect(normalizePagination({})).toEqual({ pn: 1, ps: 10, offset: 0 });
  });
  test('clamps invalid and oversized input', () => {
    expect(normalizePagination({ pn: 0, ps: 500 })).toEqual({ pn: 1, ps: 100, offset: 0 });
    expect(normalizePagination({ pn: 3, ps: 20 })).toEqual({ pn: 3, ps: 20, offset: 40 });
  });
});
