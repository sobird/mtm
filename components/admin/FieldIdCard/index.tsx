'use client';

import { Controller, useFormContext } from 'react-hook-form';

import FieldUploadFile from '../FieldUploadFile';
import type { VenusUploadResponse } from '../FieldUploadFile';

import styles from './FieldIdCard.module.css';

export type FieldIdCardValue = [string?, string?];

export interface FieldIdCardProps {
  name?: string;
  value?: FieldIdCardValue;
  defaultValue?: FieldIdCardValue;
  onChange?: (value: FieldIdCardValue) => void;
  onUploadSuccess?: (res: VenusUploadResponse, index: number) => void;
  disabled?: boolean;
}

function toPair(value: unknown): FieldIdCardValue {
  if (!Array.isArray(value)) {
    return [];
  }

  return [typeof value[0] === 'string' ? value[0] : '', typeof value[1] === 'string' ? value[1] : ''];
}

interface ViewProps extends Omit<FieldIdCardProps, 'name' | 'value' | 'defaultValue' | 'onChange'> {
  value: FieldIdCardValue;
  onChange: (value: FieldIdCardValue) => void;
  error?: string;
}

function FieldIdCardView({ value, onChange, onUploadSuccess, disabled, error }: ViewProps) {
  const update = (index: 0 | 1, next: string[]) => {
    const pair: FieldIdCardValue = [value[0] ?? '', value[1] ?? ''];
    pair[index] = next[0] ?? '';
    onChange(pair);
  };

  return (
    <div className={styles.idCard}>
      <FieldUploadFile
        value={value[0] ? [value[0]] : []}
        onChange={next => update(0, next)}
        onUploadSuccess={res => onUploadSuccess?.(res, 0)}
        maxCount={1}
        accept='image/*'
        maxSizeMB={10}
        disabled={disabled}
      >
        <span className={styles.sketch}>
          <img className={styles.sketchImage} src='/assets/idcard_1.png' alt='人像面' />
          <span className={styles.sketchTip}>人像面</span>
        </span>
      </FieldUploadFile>

      <FieldUploadFile
        value={value[1] ? [value[1]] : []}
        onChange={next => update(1, next)}
        onUploadSuccess={res => onUploadSuccess?.(res, 1)}
        maxCount={1}
        accept='image/*'
        maxSizeMB={10}
        disabled={disabled}
      >
        <span className={styles.sketch}>
          <img className={styles.sketchImage} src='/assets/idcard_2.png' alt='国徽面' />
          <span className={styles.sketchTip}>国徽面</span>
        </span>
      </FieldUploadFile>

      {error ? (
        <p role='alert' className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface BoundProps extends FieldIdCardProps {
  name: string;
  control: ReturnType<typeof useFormContext>['control'];
}

function FieldIdCardBound({ name, control, value: _value, onChange, ...rest }: BoundProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FieldIdCardView
          {...rest}
          value={toPair(field.value)}
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

export function FieldIdCard(props: FieldIdCardProps) {
  const methods = useFormContext();

  if (methods?.control && props.name) {
    return <FieldIdCardBound {...props} name={props.name} control={methods.control} />;
  }

  return (
    <FieldIdCardView
      {...props}
      value={toPair(props.value ?? props.defaultValue)}
      onChange={next => props.onChange?.(next)}
    />
  );
}

export default FieldIdCard;
