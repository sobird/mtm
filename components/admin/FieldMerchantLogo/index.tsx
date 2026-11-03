'use client';

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

const STATUS_LABELS: Record<MerchantLogoStatus, string> = {
  4: '审核中',
  5: '审核驳回',
  6: '审核通过',
};

const REVIEW_TIP = '您已申请修改店铺标志，当前处于审核中，审核通过前，会向消费者展示原来的店铺标志，感谢您的耐心等待';
const NORMAL_TIP = '新上传的店铺标志通过审核后，会替换掉原有的店铺标志，点击右上角的保存后上传';

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
  const toast = useToast();
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
      toast.error('照片大小不能超过10MB');
      return false;
    }

    try {
      const { width, height } = await readImageSize(file);

      if (width !== height) {
        toast.error('请上传正方形的店铺标志图片');
        return false;
      }

      if (width < 200) {
        toast.error('店铺标志图片需要大于100*100像素');
        return false;
      }

      return true;
    } catch {
      toast.error('图片读取失败，请重新上传');
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
          accept='image/*,.pdf,.bpm'
          maxSizeMB={10}
          disabled={disabled || (Boolean(current[0]) && status === 6)}
        />

        {current[0] && status ? (
          <>
            <span className={styles.arrow}>修改为 》</span>
            <FieldUploadFile
              value={current[1] ? [current[1]] : []}
              onChange={next => update([current[0], next[0] ?? ''])}
              beforeUpload={validate}
              maxCount={1}
              accept='image/*,.pdf,.bpm'
              maxSizeMB={10}
              disabled={disabled}
              itemOverlay={() => (
                <span className={styles.status} title={REVIEW_TIP}>
                  {STATUS_LABELS[status]}
                </span>
              )}
            />
          </>
        ) : null}
      </div>

      <p className={styles.description}>
        1.店铺标志会在店铺页，订单页等地方，展示给消费者；
        <br />
        2.请上传正方形图片，不小于100*100像素；
        <br />
        3.格式支持：JPG/JPEG/PNG/GIF/BPM；
      </p>
      <p className={styles.tip}>{current[0] && status === 4 ? REVIEW_TIP : NORMAL_TIP}</p>
    </div>
  );
}

export default FieldMerchantLogo;
