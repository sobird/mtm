'use client';

import { useTranslations } from 'next-intl';
import { Controller, useFormContext } from 'react-hook-form';

import { Checkbox, DatePicker } from '@/components/ui';

import styles from './FieldTermPicker.module.css';

/** `[long-term valid, start date, end date]` — mirrors the legacy FieldTermPick contract. */
export type FieldTermPickerValue = [boolean?, string?, string?];

export interface FieldTermPickerProps {
  name?: string;
  value?: FieldTermPickerValue;
  defaultValue?: FieldTermPickerValue;
  onChange?: (value: FieldTermPickerValue) => void;
  rangePicker?: boolean;
  disabled?: boolean;
  format?: string;
}

function toTerm(value: unknown): FieldTermPickerValue {
  if (!Array.isArray(value)) {
    return [false];
  }

  return [
    Boolean(value[0]),
    typeof value[1] === 'string' ? value[1] : undefined,
    typeof value[2] === 'string' ? value[2] : undefined,
  ];
}

interface ViewProps extends Omit<FieldTermPickerProps, 'name' | 'value' | 'defaultValue' | 'onChange' | 'format'> {
  value: FieldTermPickerValue;
  onChange: (value: FieldTermPickerValue) => void;
  error?: string;
}

function FieldTermPickerView({ value, onChange, rangePicker = false, disabled = false, error }: ViewProps) {
  const t = useTranslations('entry.termPicker');
  const [checked = false, start, end] = value;
  const datesDisabled = disabled || checked;

  return (
    <div className={styles.picker}>
      <div className={styles.dates}>
        <DatePicker
          className={styles.date}
          value={start ?? ''}
          disabled={datesDisabled}
          aria-label={t('start')}
          onChange={next => onChange(rangePicker ? [checked, next, end] : [checked, next])}
        />
        {rangePicker ? (
          <>
            <span className={styles.separator}>{t('to')}</span>
            <DatePicker
              className={styles.date}
              value={end ?? ''}
              disabled={datesDisabled}
              aria-label={t('end')}
              onChange={next => onChange([checked, start, next])}
            />
          </>
        ) : null}
      </div>

      <Checkbox
        checked={checked}
        disabled={disabled}
        label={t('longTerm')}
        onChange={event => onChange([event.target.checked, start, end])}
      />

      {error ? (
        <p role='alert' className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface BoundProps extends FieldTermPickerProps {
  name: string;
  control: ReturnType<typeof useFormContext>['control'];
}

function FieldTermPickerBound({ name, control, value: _value, onChange, ...rest }: BoundProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FieldTermPickerView
          {...rest}
          value={toTerm(field.value)}
          onChange={next => {
            field.onChange(next);
            onChange?.(next);
          }}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export function FieldTermPicker(props: FieldTermPickerProps) {
  const methods = useFormContext();

  if (methods?.control && props.name) {
    return <FieldTermPickerBound {...props} name={props.name} control={methods.control} />;
  }

  return (
    <FieldTermPickerView
      {...props}
      value={toTerm(props.value ?? props.defaultValue)}
      onChange={next => props.onChange?.(next)}
    />
  );
}

export default FieldTermPicker;
