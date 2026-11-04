'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Upload, useToast } from '@/components/ui';
import { uploadProductImage } from '@/lib/services/products';
import { translateApiError } from '@/lib/translate-api-error';

import { MAX_IMAGES } from '../ProductForm/schema';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export interface ProductImageFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

/** 商品图片上传：限制 PNG / JPEG / WEBP 且单张不超过 10MB。 */
export function ProductImageField({ value, onChange, disabled = false }: ProductImageFieldProps) {
  const t = useTranslations('product.image');
  const tRoot = useTranslations();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    const validFiles: File[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        toast.error(t('unsupportedType', { name: file.name }));
        continue;
      }

      if (file.size > MAX_BYTES) {
        toast.error(t('tooLarge', { name: file.name }));
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    const remaining = MAX_IMAGES - value.length;

    if (remaining <= 0) {
      toast.error(t('max', { max: MAX_IMAGES }));
      return;
    }

    if (validFiles.length > remaining) {
      toast.error(t('maxIgnored', { max: MAX_IMAGES }));
    }

    // 按 brief 要求逐个串行上传；本地 `current` 保证连续追加时不会丢失前一张。
    let current = value;

    setUploading(true);

    try {
      for (const file of validFiles.slice(0, remaining)) {
        try {
          // eslint-disable-next-line no-await-in-loop -- 按 brief 要求逐个串行上传
          const asset = await uploadProductImage(file);

          current = [...current, asset.url].slice(0, MAX_IMAGES);
          onChange(current);
        } catch (error) {
          toast.error(translateApiError(error, tRoot, 'product.toast.actionFailed'));
        }
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Upload
        value={value}
        onChange={onChange}
        onFilesSelected={handleFilesSelected}
        maxCount={MAX_IMAGES}
        accept='image/png,image/jpeg,image/webp'
        disabled={disabled || uploading}
        itemOverlay={(_url, index) =>
          index === 0 ? (
            <span
              style={{
                padding: '0 4px',
                color: '#fff',
                background: 'rgba(0, 0, 0, 0.6)',
                borderRadius: 2,
                fontSize: 12,
              }}
            >
              {t('main')}
            </span>
          ) : null
        }
      />
      {/* Stable E2E hook: the antd Upload input is not addressable by test id. */}
      <input
        type='file'
        data-testid='product-image-input'
        accept='image/png,image/jpeg,image/webp'
        multiple
        hidden
        disabled={disabled || uploading}
        onChange={event => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          void handleFilesSelected(files);
        }}
      />
      {uploading ? <p style={{ marginTop: 8, color: 'var(--color-text-secondary)' }}>{t('uploading')}</p> : null}
    </div>
  );
}

export default ProductImageField;
