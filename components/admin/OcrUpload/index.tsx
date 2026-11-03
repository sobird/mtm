'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { ApiError, apiFetch } from '@/lib/api-client';
import type { VenusOcrResult } from '@/lib/services/venus';

import FieldUploadFile from '../FieldUploadFile';
import type { VenusUploadResponse } from '../FieldUploadFile';

import styles from './OcrUpload.module.css';

export interface OcrUploadProps {
  name?: string;
  /** 0 = ID card, 1 = business license. */
  type?: number;
  value?: string;
  onChange?: (value: string) => void;
  onUploadSuccess?: (res: VenusOcrResult) => void;
  children?: ReactNode;
  disabled?: boolean;
}

interface ViewProps extends Omit<OcrUploadProps, 'name' | 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function OcrUploadView({ type = 0, value, onChange, onUploadSuccess, children, disabled, error }: ViewProps) {
  const [recognizing, setRecognizing] = useState(false);
  const [ocrError, setOcrError] = useState<string>();

  const handleUpload = async (res: VenusUploadResponse) => {
    setRecognizing(true);
    setOcrError(undefined);

    try {
      const result = await apiFetch<VenusOcrResult>('/api/venus/ocr', {
        method: 'POST',
        body: { image: res.url, type },
      });

      onUploadSuccess?.(result);
    } catch (recognizeError) {
      setOcrError(recognizeError instanceof ApiError ? recognizeError.message : '图片识别失败');
    } finally {
      setRecognizing(false);
    }
  };

  return (
    <div className={styles.ocrUpload}>
      <FieldUploadFile
        value={value ? [value] : []}
        onChange={next => onChange(next[0] ?? '')}
        onUploadSuccess={handleUpload}
        maxCount={1}
        accept='image/*'
        maxSizeMB={20}
        disabled={disabled}
      >
        {children}
      </FieldUploadFile>
      {recognizing ? <p className={styles.hint}>识别中…</p> : null}
      {ocrError ? (
        <p role='alert' className={styles.error}>
          {ocrError}
        </p>
      ) : null}
      {error ? (
        <p role='alert' className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface BoundProps extends OcrUploadProps {
  name: string;
  control: ReturnType<typeof useFormContext>['control'];
}

function OcrUploadBound({ name, control, value: _value, onChange, ...rest }: BoundProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <OcrUploadView
          {...rest}
          value={typeof field.value === 'string' ? field.value : ''}
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

export function OcrUpload(props: OcrUploadProps) {
  const methods = useFormContext();

  if (methods?.control && props.name) {
    return <OcrUploadBound {...props} name={props.name} control={methods.control} />;
  }

  return <OcrUploadView {...props} value={props.value ?? ''} onChange={next => props.onChange?.(next)} />;
}

export default OcrUpload;
