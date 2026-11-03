'use client';

import { useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';

import { cx } from '../cx';
import { Dialog } from '../Dialog';

import styles from './Upload.module.css';

export interface UploadProps {
  /** Uploaded file URLs, controlled by the caller. */
  value?: string[];
  /** Called when an existing item is removed. */
  onChange?: (value: string[]) => void;
  /** Called with the freshly selected files. Uploading happens in the caller. */
  onFilesSelected?: (files: File[]) => void | Promise<void>;
  maxCount?: number;
  accept?: string;
  disabled?: boolean;
  multiple?: boolean;
  className?: string;
  /** Trigger content; defaults to a 点击上传 tile. */
  children?: ReactNode;
  /** Hide the trigger once `maxCount` items are present. Defaults to true. */
  autoHidden?: boolean;
  /** Extra overlay content rendered on each thumbnail. */
  itemOverlay?: (url: string, index: number) => ReactNode;
}

const IMAGE_PATTERN = /\.(png|jpe?g|gif|bmp|webp|svg)(\?|$)/i;

function isImageUrl(url: string): boolean {
  return url.startsWith('data:image/') || IMAGE_PATTERN.test(url);
}

function fileName(url: string): string {
  if (url.startsWith('data:')) {
    return '图片';
  }

  const segment = url.split('?')[0].split('/').pop();

  return segment || url;
}

export function Upload({
  value = [],
  onChange,
  onFilesSelected,
  maxCount,
  accept,
  disabled = false,
  multiple,
  className,
  children,
  autoHidden = true,
  itemOverlay,
}: UploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const items = value.filter(Boolean);
  const occurrences = new Map<string, number>();
  const keyedItems = items.map(url => {
    const count = occurrences.get(url) ?? 0;
    occurrences.set(url, count + 1);

    return { url, key: `${url}#${count}` };
  });
  const full = Boolean(maxCount && items.length >= maxCount);
  const canUpload = !disabled && !full;
  const allowMultiple = multiple ?? (maxCount === undefined || maxCount > 1);

  const handleSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (selected.length === 0) {
      return;
    }

    const remaining = maxCount ? Math.max(maxCount - items.length, 0) : selected.length;
    const files = selected.slice(0, remaining);

    if (files.length > 0) {
      await onFilesSelected?.(files);
    }
  };

  const handleRemove = (index: number) => {
    onChange?.(items.filter((_, current) => current !== index));
  };

  const handlePreview = (url: string) => {
    if (!isImageUrl(url)) {
      return;
    }

    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  return (
    <div className={cx(styles.upload, className)}>
      <ul className={styles.list}>
        {keyedItems.map(({ url, key }, index) => (
          <li key={key} className={styles.item}>
            <button
              type='button'
              className={cx(styles.thumb, isImageUrl(url) && styles.imageThumb)}
              onClick={() => handlePreview(url)}
              title={fileName(url)}
            >
              {isImageUrl(url) ? (
                <img className={styles.image} src={url} alt={fileName(url)} />
              ) : (
                <span className={styles.fileName}>{fileName(url)}</span>
              )}
            </button>
            {!disabled ? (
              <button type='button' className={styles.remove} aria-label='删除文件' onClick={() => handleRemove(index)}>
                ×
              </button>
            ) : null}
            {itemOverlay ? <span className={styles.overlay}>{itemOverlay(url, index)}</span> : null}
          </li>
        ))}

        {canUpload || !autoHidden ? (
          <li className={styles.item}>
            <label className={cx(styles.trigger, disabled && styles.disabled)}>
              {children ?? (
                <span className={styles.triggerDefault}>
                  <span className={styles.plus} aria-hidden='true'>
                    +
                  </span>
                  <span>点击上传</span>
                </span>
              )}
              <input
                type='file'
                className={styles.input}
                accept={accept}
                multiple={allowMultiple}
                disabled={disabled}
                onChange={handleSelect}
              />
            </label>
          </li>
        ) : null}
      </ul>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen} title='预览' footer={null}>
        {previewUrl ? <img className={styles.preview} src={previewUrl} alt='预览' /> : null}
      </Dialog>
    </div>
  );
}

export default Upload;
