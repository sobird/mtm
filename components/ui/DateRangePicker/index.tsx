'use client';

import { DatePicker as AntDatePicker } from 'antd';
import type { Dayjs } from 'dayjs';

import { DATE_FORMAT, DATE_TIME_DISPLAY_FORMAT, DATE_TIME_FORMAT, toDayjs } from '../date-value';

export type DateRangeValue = [string, string];

export interface DateRangePickerProps {
  /** Stored values: `YYYY-MM-DD` pairs, or `YYYY-MM-DDTHH:mm` pairs when `showTime`. */
  value?: DateRangeValue | null;
  onChange?: (value: DateRangeValue | null) => void;
  showTime?: boolean;
  /** Display format; defaults to `YYYY-MM-DD` or `YYYY-MM-DD HH:mm`. */
  format?: string;
  placeholder?: [string, string];
  /** Forwarded to the two inner inputs for label association. */
  id?: string | { start?: string; end?: string };
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  showTime = false,
  format,
  placeholder,
  id,
  disabled,
  allowClear = true,
  className,
}: DateRangePickerProps) {
  const parsed = value ? ([toDayjs(value[0]), toDayjs(value[1])] as [Dayjs | null, Dayjs | null]) : null;

  return (
    <AntDatePicker.RangePicker
      id={id}
      className={className}
      value={parsed}
      showTime={showTime ? { format: 'HH:mm' } : false}
      format={format ?? (showTime ? DATE_TIME_DISPLAY_FORMAT : DATE_FORMAT)}
      placeholder={placeholder}
      disabled={disabled}
      allowClear={allowClear}
      onChange={dates => {
        if (!dates?.[0] || !dates[1]) {
          onChange?.(null);
          return;
        }

        const output = showTime ? DATE_TIME_FORMAT : DATE_FORMAT;
        onChange?.([dates[0].format(output), dates[1].format(output)]);
      }}
    />
  );
}

export default DateRangePicker;
