'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Upload, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { translateApiError } from '@/lib/translate-api-error';

import styles from './FieldUploadFile.module.css';

export interface VenusUploadResponse {
  url: string;
  name?: string;
  size?: number;
  type?: string;
  [key: string]: unknown;
}

export interface FieldUploadFileProps {
  /** Bind to a form field by name when rendered inside `Form`. */
  name?: string;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  onUploadSuccess?: (res: VenusUploadResponse, index: number) => void;
  maxCount?: number;
  accept?: string;
  disabled?: boolean;
  /** Per-file size limit in MB. Defaults to 20 (the server limit). */
  maxSizeMB?: number;
  /** Return false to reject a file before it is uploaded. */
  beforeUpload?: (file: File) => boolean | Promise<boolean>;
  children?: ReactNode;
  className?: string;
  itemOverlay?: (url: string, index: number) => ReactNode;
}

function toUrls(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item !== '') : [];
}

interface ViewProps extends Omit<FieldUploadFileProps, 'name' | 'value' | 'defaultValue' | 'onChange'> {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

function FieldUploadFileView({
  value,
  onChange,
  error,
  onUploadSuccess,
  maxCount,
  accept,
  disabled,
  maxSizeMB = 20,
  beforeUpload,
  children,
  className,
  itemOverlay,
}: ViewProps) {
  const t = useTranslations('entry.upload');
  const tRoot = useTranslations();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: File[]) => {
    setUploading(true);

    try {
      const results = await Promise.all(
        files.map(async file => {
          if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(t('tooLarge', { max: maxSizeMB }));
            return null;
          }

          if (beforeUpload && !(await beforeUpload(file))) {
            return null;
          }

          const formData = new FormData();
          formData.append('file', file);

          try {
            const res = await apiFetch<VenusUploadResponse>('/api/venus/upload', {
              method: 'POST',
              body: formData,
            });

            return res?.url ? res : null;
          } catch (uploadError) {
            toast.error(translateApiError(uploadError, tRoot, 'entry.upload.failed'));
            return null;
          }
        })
      );

      const uploaded = results.filter((res): res is VenusUploadResponse => Boolean(res?.url));
      uploaded.forEach((res, index) => onUploadSuccess?.(res, value.length + index));

      if (uploaded.length > 0) {
        onChange([...value, ...uploaded.map(res => res.url)]);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <Upload
        value={value}
        onChange={onChange}
        onFilesSelected={handleFiles}
        maxCount={maxCount}
        accept={accept}
        disabled={disabled || uploading}
        itemOverlay={itemOverlay}
      >
        {children}
      </Upload>
      {uploading ? <p className={styles.hint}>{t('uploading')}</p> : null}
      {error ? (
        <p role='alert' className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface BoundProps extends FieldUploadFileProps {
  name: string;
  control: ReturnType<typeof useFormContext>['control'];
}

function FieldUploadFileBound({ name, control, value: _value, onChange, ...rest }: BoundProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FieldUploadFileView
          {...rest}
          value={toUrls(field.value)}
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

export function FieldUploadFile(props: FieldUploadFileProps) {
  const methods = useFormContext();

  if (methods?.control && props.name) {
    return <FieldUploadFileBound {...props} name={props.name} control={methods.control} />;
  }

  return (
    <FieldUploadFileView
      {...props}
      value={toUrls(props.value ?? props.defaultValue)}
      onChange={next => props.onChange?.(next)}
    />
  );
}

export default FieldUploadFile;
