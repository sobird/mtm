import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

/** Stored/emitted format for date-only fields. */
export const DATE_FORMAT = 'YYYY-MM-DD';
/** Stored/emitted format for date-time fields (native `datetime-local` shape). */
export const DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm';
/** Display format for date-time fields. */
export const DATE_TIME_DISPLAY_FORMAT = 'YYYY-MM-DD HH:mm';

/** Parses a stored string into dayjs, returning null for empty or invalid input. */
export function toDayjs(value: string | null | undefined): Dayjs | null {
  if (!value) {
    return null;
  }

  const parsed = dayjs(value);

  return parsed.isValid() ? parsed : null;
}

/** Formats dayjs back into the stored string contract. */
export function fromDayjs(value: Dayjs | null | undefined, withTime = false): string {
  if (!value) {
    return '';
  }

  return value.format(withTime ? DATE_TIME_FORMAT : DATE_FORMAT);
}
