'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useToast } from '@/components/ui';

import FieldUploadFile from '../FieldUploadFile';

import styles from './FieldMerchantLogo.module.css';

export type FieldMerchantLogoValue = [string?, string?];

export type MerchantLogoStatus = 4 | 5 | 6;

export interface FieldMerchantLogoProps {
  value?: FieldMerchantLogoValue;
  defaultValue?: FieldMerchantLogoValue;
  onChange?: (value: FieldMerchantLogoValue) => void;
  status: MerchantLogoStatus;
  disabled?: boolean;
}

function toPair(value: unknown): FieldMerchantLogoValue {
  if (!Array.isArray(value)) {
    return [];
  }

  return [typeof value[0] === 'string' ? value[0] : '', typeof value[1] === 'string' ? value[1] : ''];
}

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () =>
        resolve({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
      image.onerror = reject;
      image.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function FieldMerchantLogo({ value, defaultValue = [], onChange, status, disabled }: FieldMerchantLogoProps) {
  const t = useTranslations('entry.merchantLogo');
  const toast = useToast();
  const statusLabels: Record<MerchantLogoStatus, string> = {
    4: t('statusReviewing'),
    5: t('statusRejected'),
    6: t('statusApproved'),
  };
  const [internal, setInternal] = useState<FieldMerchantLogoValue>(() => toPair(defaultValue));
  const current = value !== undefined ? toPair(value) : internal;

  const update = (next: FieldMerchantLogoValue) => {
    if (value === undefined) {
      setInternal(next);
    }
    onChange?.(next);
  };

  const validate = async (file: File): Promise<boolean> => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('tooLarge'));
      return false;
    }

    try {
      const { width, height } = await readImageSize(file);

      if (width !== height) {
        toast.error(t('squareRequired'));
        return false;
      }

      if (width < 200) {
        toast.error(t('minSize'));
        return false;
      }

      return true;
    } catch {
      toast.error(t('readFailed'));
      return false;
    }
  };

  return (
    <div className={styles.logo}>
      <div className={styles.fields}>
        <FieldUploadFile
          value={current[0] ? [current[0]] : []}
          onChange={next => update([next[0] ?? '', current[1]])}
          beforeUpload={validate}
          maxCount={1}
          accept='image/*'
          maxSizeMB={10}
          disabled={disabled || (Boolean(current[0]) && status === 6)}
        />

        {current[0] && status ? (
          <>
            <span className={styles.arrow}>{t('changeArrow')}</span>
            <FieldUploadFile
              value={current[1] ? [current[1]] : []}
              onChange={next => update([current[0], next[0] ?? ''])}
              beforeUpload={validate}
              maxCount={1}
              accept='image/*'
              maxSizeMB={10}
              disabled={disabled}
              itemOverlay={() => (
                <span className={styles.status} title={t('reviewTip')}>
                  {statusLabels[status]}
                </span>
              )}
            />
          </>
        ) : null}
      </div>

      <p className={styles.description}>
        {t('description1')}
        <br />
        {t('description2')}
        <br />
        {t('description3')}
      </p>
      <p className={styles.tip}>{current[0] && status === 4 ? t('reviewTip') : t('normalTip')}</p>
    </div>
  );
}

export default FieldMerchantLogo;
