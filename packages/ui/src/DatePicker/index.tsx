'use client';

import { DatePicker as AntDatePicker } from 'antd';

import { DATE_FORMAT, fromDayjs, toDayjs } from '../date-value';

export interface DatePickerProps {
  /** Stored value in `YYYY-MM-DD`. */
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  allowClear = true,
  className,
  id,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  return (
    <AntDatePicker
      id={id}
      className={className}
      aria-label={ariaLabel}
      value={toDayjs(value)}
      format={DATE_FORMAT}
      placeholder={placeholder}
      disabled={disabled}
      allowClear={allowClear}
      onChange={date => onChange?.(fromDayjs(date))}
    />
  );
}

export default DatePicker;
