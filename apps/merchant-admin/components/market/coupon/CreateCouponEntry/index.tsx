'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Button, Dialog } from '@/components/ui';
import { cx } from '@/components/ui/cx';

import styles from './CreateCouponEntry.module.css';

interface CouponTarget {
  value: number;
  label: string;
  image: string;
  description: string;
}

const COUPON_TARGETS: CouponTarget[] = [
  {
    value: 1,
    label: '店铺商品券',
    image: '/assets/coupon/coupon_target_1.png',
    description: '发放店铺商品促销优惠券，提升商品转化，带动商品销量，用户可在商详页、IM等渠道领券后使用',
  },
  {
    value: 2,
    label: '店铺通用券',
    image: '/assets/coupon/coupon_target_2.png',
    description: '发放店铺通用优惠券，提升店铺整体转化效果，用户可在商详页等渠道领取后使用',
  },
  {
    value: 3,
    label: '店铺客服体验券',
    image: '/assets/coupon/coupon_target_3.png',
    description: '发放用户安慰、赔付、奖励优惠券，提升用户服务体验，强化客户关系，用户可在IM客服渠道领券后使用',
  },
];

export interface CreateCouponEntryProps {
  children?: ReactNode;
}

export function CreateCouponEntry({ children }: CreateCouponEntryProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);

  const handleConfirm = () => {
    if (!selected) {
      return;
    }

    setOpen(false);
    router.push(`/market/coupon/create?target=${selected}`);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>{children ?? '创建优惠券'}</Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title='请选择券类型'
        footer={
          <div className={styles.footer}>
            <Button variant='secondary' onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button disabled={!selected} onClick={handleConfirm}>
              下一步
            </Button>
          </div>
        }
      >
        <div className={styles.list}>
          {COUPON_TARGETS.map(item => (
            <button
              type='button'
              key={item.value}
              className={cx(styles.item, selected === item.value && styles.active)}
              aria-label={item.label}
              aria-pressed={selected === item.value}
              onClick={() => setSelected(item.value)}
            >
              <span className={styles.icon}>
                <img src={item.image} alt='' />
              </span>
              <span className={styles.text}>
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </span>
              <span className={styles.mark} aria-hidden='true' />
            </button>
          ))}
        </div>
      </Dialog>
    </>
  );
}

export default CreateCouponEntry;
