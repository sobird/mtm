'use client';

import { useState } from 'react';

import { Upload, useToast } from '@/components/ui';
import { ApiError } from '@/lib/api-client';
import { uploadProductImage } from '@/lib/services/products';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export interface ProductImageFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

/** 商品图片上传：限制 PNG / JPEG / WEBP 且单张不超过 10MB。 */
export function ProductImageField({ value, onChange, disabled = false }: ProductImageFieldProps) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    const validFiles: File[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        toast.error(`${file.name}：仅支持 PNG / JPEG / WEBP 图片`);
        continue;
      }

      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}：图片大小不能超过 10MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    setUploading(true);

    try {
      const results = await Promise.all(
        validFiles.map(async file => {
          try {
            const asset = await uploadProductImage(file);

            return asset.url;
          } catch (error) {
            toast.error(error instanceof ApiError ? error.message : `${file.name} 上传失败`);

            return null;
          }
        })
      );
      const urls = results.filter((url): url is string => url !== null);

      if (urls.length > 0) {
        onChange([...value, ...urls]);
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
        maxCount={5}
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
              主图
            </span>
          ) : null
        }
      />
      {uploading ? <p style={{ marginTop: 8, color: 'var(--color-text-secondary)' }}>图片上传中…</p> : null}
    </div>
  );
}

export default ProductImageField;
