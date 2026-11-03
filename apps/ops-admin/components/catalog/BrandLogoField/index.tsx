'use client';

import type { UploadResult } from '@mtm/contracts';
import { Upload, useToast } from '@mtm/ui';
import { Controller, useFormContext } from 'react-hook-form';

import { ApiError, apiFetch } from '@/lib/api-client';

const ACCEPT = 'image/png,image/jpeg,image/webp';

/**
 * Binds a single image logo to the surrounding brand form's `logoUrl` field.
 * Selecting a file uploads it through the BFF and stores the returned URL.
 */
export function BrandLogoField() {
  const toast = useToast();
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name='logoUrl'
      render={({ field }) => (
        <Upload
          value={field.value ? [field.value as string] : []}
          onChange={value => field.onChange(value[0] ?? null)}
          onFilesSelected={async files => {
            const file = files[0];

            if (!file) {
              return;
            }

            try {
              const formData = new FormData();
              formData.append('file', file);
              const result = await apiFetch<UploadResult>('/api/bff/uploads/images', {
                method: 'POST',
                body: formData,
              });
              field.onChange(result.url);
            } catch (error) {
              toast.error(error instanceof ApiError ? error.message : '图片上传失败，请稍后重试');
            }
          }}
          maxCount={1}
          accept={ACCEPT}
        />
      )}
    />
  );
}

export default BrandLogoField;
