'use client';

import { useTranslations } from 'next-intl';
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

export interface CreateCouponEntryProps {
  children?: ReactNode;
}

export function CreateCouponEntry({ children }: CreateCouponEntryProps) {
  const router = useRouter();
  const t = useTranslations('marketing');
  const tEntry = useTranslations('marketing.coupon.entry');
  const tCommon = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);

  const couponTargets: CouponTarget[] = [
    {
      value: 1,
      label: t('target.product'),
      image: '/assets/coupon/coupon_target_1.png',
      description: tEntry('productDescription'),
    },
    {
      value: 2,
      label: t('target.universal'),
      image: '/assets/coupon/coupon_target_2.png',
      description: tEntry('universalDescription'),
    },
    {
      value: 3,
      label: t('target.service'),
      image: '/assets/coupon/coupon_target_3.png',
      description: tEntry('serviceDescription'),
    },
  ];

  const handleConfirm = () => {
    if (!selected) {
      return;
    }

    setOpen(false);
    router.push(`/market/coupon/create?target=${selected}`);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>{children ?? t('coupon.create')}</Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={tEntry('title')}
        footer={
          <div className={styles.footer}>
            <Button variant='secondary' onClick={() => setOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button disabled={!selected} onClick={handleConfirm}>
              {tEntry('next')}
            </Button>
          </div>
        }
      >
        <div className={styles.list}>
          {couponTargets.map(item => (
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
