import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { PageContainer } from '@/components/layout/PageContainer';
import CouponForm from '@/components/market/coupon/CouponForm';

import styles from '../page.module.css';

const VALID_TARGETS = new Set([1, 2, 3]);

export default async function CouponCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string | string[] }>;
}) {
  const raw = (await searchParams).target;
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  const target = VALID_TARGETS.has(value) ? value : 1;

  const [t, common] = await Promise.all([getTranslations('marketing'), getTranslations('common')]);

  return (
    <PageContainer
      title={t('coupon.createTitle')}
      breadcrumbs={[
        { label: common('home'), href: '/' },
        { label: t('home.title') },
        { label: t('coupon.title'), href: '/market/coupons' },
        { label: t('coupon.createTitle') },
      ]}
      actions={
        <div className={styles.actions}>
          <Link className={styles.actionLink} href='/market/coupons'>
            {t('coupon.back')}
          </Link>
        </div>
      }
    >
      <CouponForm mode='create' target={target} />
    </PageContainer>
  );
}
