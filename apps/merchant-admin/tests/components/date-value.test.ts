import { describe, expect, test } from 'vitest';

import { DATE_FORMAT, DATE_TIME_FORMAT, fromDayjs, toDayjs } from '@/components/ui/date-value';

describe('date-value', () => {
  test('parses stored strings into dayjs', () => {
    expect(toDayjs('2026-11-03')?.format(DATE_FORMAT)).toBe('2026-11-03');
    expect(toDayjs('2026-11-03T10:30')?.format(DATE_TIME_FORMAT)).toBe('2026-11-03T10:30');
  });

  test('returns null for empty and unparseable input', () => {
    expect(toDayjs('')).toBeNull();
    expect(toDayjs(null)).toBeNull();
    expect(toDayjs(undefined)).toBeNull();
    expect(toDayjs('not a date')).toBeNull();
  });

  test('formats dayjs back into the stored contracts', () => {
    const value = toDayjs('2026-11-03T10:30');

    expect(fromDayjs(value)).toBe('2026-11-03');
    expect(fromDayjs(value, true)).toBe('2026-11-03T10:30');
    expect(fromDayjs(null, true)).toBe('');
  });
});
