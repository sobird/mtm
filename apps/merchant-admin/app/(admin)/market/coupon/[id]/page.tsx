import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageContainer } from '@/components/layout/PageContainer';
import CouponForm from '@/components/market/coupon/CouponForm';
import { initDatabase } from '@/lib/db';
import { getCoupon } from '@/lib/services/coupon';
import type { CouponDetailDTO } from '@/lib/services/coupon';

import styles from '../page.module.css';

export const dynamic = 'force-dynamic';

export default async function CouponDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await initDatabase();

  const [t, common] = await Promise.all([getTranslations('marketing'), getTranslations('common')]);

  let coupon: CouponDetailDTO;

  try {
    coupon = await getCoupon(id);
  } catch {
    notFound();
  }

  const canEdit = coupon.status < 2;

  return (
    <PageContainer
      title={t('coupon.detailTitle')}
      breadcrumbs={[
        { label: common('home'), href: '/' },
        { label: t('home.title') },
        { label: t('coupon.title'), href: '/market/coupons' },
        { label: t('coupon.detailTitle') },
      ]}
      actions={
        <div className={styles.actions}>
          <Link className={styles.actionLink} href='/market/coupons'>
            {t('coupon.back')}
          </Link>
          {canEdit ? (
            <Link className={`${styles.actionLink} ${styles.primary}`} href={`/market/coupon/update/${coupon.id}`}>
              {t('coupon.edit')}
            </Link>
          ) : null}
        </div>
      }
    >
      <CouponForm mode='detail' initialValues={coupon} />
    </PageContainer>
  );
}
