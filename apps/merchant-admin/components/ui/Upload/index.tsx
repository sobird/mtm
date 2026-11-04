'use client';

import type { Translate } from '@mtm/i18n';
import { Upload as AntUpload } from 'antd';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

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
  /** Trigger content; defaults to a "click to upload" tile. */
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

function fileName(url: string, t: Translate): string {
  if (url.startsWith('data:')) {
    return t('image');
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
  const t = useTranslations('common');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const pendingFiles = useRef<File[]>([]);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (flushTimer.current !== null) {
        clearTimeout(flushTimer.current);
      }
    },
    []
  );
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

  /** `beforeUpload` fires once per file, so batch the selection on the next tick. */
  const queueFile = (file: File) => {
    pendingFiles.current.push(file);

    if (flushTimer.current !== null) {
      return;
    }

    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      const batch = pendingFiles.current;
      pendingFiles.current = [];
      const remaining = maxCount ? Math.max(maxCount - items.length, 0) : batch.length;
      const files = batch.slice(0, remaining);

      if (files.length > 0) {
        void onFilesSelected?.(files);
      }
    }, 0);
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
              title={fileName(url, t)}
            >
              {isImageUrl(url) ? (
                <img className={styles.image} src={url} alt={fileName(url, t)} />
              ) : (
                <span className={styles.fileName}>{fileName(url, t)}</span>
              )}
            </button>
            {!disabled ? (
              <button
                type='button'
                className={styles.remove}
                aria-label={t('removeFile')}
                onClick={() => handleRemove(index)}
              >
                ×
              </button>
            ) : null}
            {itemOverlay ? <span className={styles.overlay}>{itemOverlay(url, index)}</span> : null}
          </li>
        ))}

        {canUpload || !autoHidden ? (
          <li className={styles.item}>
            <AntUpload
              className={styles.triggerUpload}
              accept={accept}
              multiple={allowMultiple}
              disabled={disabled}
              showUploadList={false}
              fileList={[]}
              beforeUpload={file => {
                queueFile(file);
                return false;
              }}
            >
              <span className={cx(styles.trigger, disabled && styles.disabled)}>
                {children ?? (
                  <span className={styles.triggerDefault}>
                    <span className={styles.plus} aria-hidden='true'>
                      +
                    </span>
                    <span>{t('upload')}</span>
                  </span>
                )}
              </span>
            </AntUpload>
          </li>
        ) : null}
      </ul>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen} title={t('preview')} footer={null}>
        {previewUrl ? <img className={styles.preview} src={previewUrl} alt={t('preview')} /> : null}
      </Dialog>
    </div>
  );
}

export default Upload;
