'use client';

import { Select as BaseSelect } from '@base-ui-components/react/select';
import { forwardRef, useState } from 'react';
import type { Ref } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';

import { cx } from '../cx';

import styles from './Select.module.css';

export type SelectOptionValue = string | number;

export interface SelectOption {
  value: SelectOptionValue;
  label: string;
}

export interface SelectProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'onChange' | 'children' | 'type'
> {
  options: SelectOption[];
  value?: SelectOptionValue;
  onChange?: (value: SelectOptionValue) => void;
  placeholder?: string;
  required?: boolean;
  /** Explicit error message; takes precedence over the form field error. */
  error?: string;
}

interface BaseSelectViewProps extends Omit<SelectProps, 'options' | 'value' | 'onChange'> {
  options: SelectOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  triggerRef?: Ref<HTMLButtonElement>;
}

function toDisplayValue(value: SelectOptionValue | null | undefined): string | null {
  return value === undefined || value === null ? null : String(value);
}

function toTypedValue(value: string | null, options: SelectOption[]): SelectOptionValue | undefined {
  if (value === null) {
    return undefined;
  }
  const option = options.find(item => String(item.value) === value);
  return option ? option.value : value;
}

function BaseSelectView({
  options,
  value,
  onValueChange,
  triggerRef,
  placeholder,
  error,
  id,
  name,
  disabled,
  required,
  className,
  ...rest
}: BaseSelectViewProps) {
  const selectedOption = value === null ? undefined : options.find(option => String(option.value) === value);
  const label = selectedOption ? selectedOption.label : (placeholder ?? '');

  return (
    <div className={cx(styles.select, className)}>
      <BaseSelect.Root<string>
        value={value as string}
        onValueChange={nextValue => onValueChange(nextValue)}
        name={name}
        id={id}
        disabled={disabled}
        required={required}
      >
        <BaseSelect.Trigger
          ref={triggerRef}
          {...rest}
          aria-invalid={error ? true : undefined}
          className={cx(styles.trigger, error && styles.invalid)}
        >
          <BaseSelect.Value>{label}</BaseSelect.Value>
          <BaseSelect.Icon className={styles.icon} aria-hidden='true'>
            ▾
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={4} className={styles.positioner}>
            <BaseSelect.Popup className={styles.popup}>
              <BaseSelect.List>
                {options.map(option => (
                  <BaseSelect.Item key={String(option.value)} value={String(option.value)} className={styles.item}>
                    <BaseSelect.ItemText className={styles.itemText}>{option.label}</BaseSelect.ItemText>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
      {error ? (
        <p role='alert' className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PlainSelect({
  value,
  onChange,
  options,
  triggerRef,
  ...rest
}: SelectProps & { triggerRef?: Ref<HTMLButtonElement> }) {
  const [internalValue, setInternalValue] = useState<SelectOptionValue | undefined>(value);
  const selectedValue = value === undefined ? internalValue : value;

  const handleValueChange = (nextValue: string | null) => {
    const typedValue = toTypedValue(nextValue, options);
    if (typedValue === undefined) {
      return;
    }
    if (value === undefined) {
      setInternalValue(typedValue);
    }
    onChange?.(typedValue);
  };

  return (
    <BaseSelectView
      {...rest}
      options={options}
      value={toDisplayValue(selectedValue)}
      onValueChange={handleValueChange}
      triggerRef={triggerRef}
    />
  );
}

function FormSelect({
  name,
  options,
  error,
  triggerRef,
  ...rest
}: SelectProps & { name: string; triggerRef?: Ref<HTMLButtonElement> }) {
  const { setValue, getFieldState } = useFormContext();
  const formState = useFormState({ name });
  const watchedValue = useWatch({ name }) as SelectOptionValue | null | undefined;
  const message = error ?? (getFieldState(name, formState).error?.message as string | undefined);

  const handleValueChange = (nextValue: string | null) => {
    const typedValue = toTypedValue(nextValue, options);
    if (typedValue === undefined) {
      return;
    }
    setValue(name, typedValue, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <BaseSelectView
      {...rest}
      name={name}
      options={options}
      value={toDisplayValue(watchedValue)}
      onValueChange={handleValueChange}
      error={message}
      triggerRef={triggerRef}
    />
  );
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(props, ref) {
  const methods = useFormContext();
  const isFormBound = Boolean(methods && props.name && props.value === undefined && props.onChange === undefined);

  if (isFormBound) {
    return <FormSelect {...props} name={props.name as string} triggerRef={ref} />;
  }

  return <PlainSelect {...props} triggerRef={ref} />;
});

export default Select;
