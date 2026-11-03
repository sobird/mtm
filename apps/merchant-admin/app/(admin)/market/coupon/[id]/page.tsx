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

  let coupon: CouponDetailDTO;

  try {
    coupon = await getCoupon(id);
  } catch {
    notFound();
  }

  const canEdit = coupon.status < 2;

  return (
    <PageContainer
      title='优惠券详情'
      breadcrumbs={[
        { label: '首页', href: '/' },
        { label: '营销中心' },
        { label: '优惠券', href: '/market/coupons' },
        { label: '优惠券详情' },
      ]}
      actions={
        <div className={styles.actions}>
          <Link className={styles.actionLink} href='/market/coupons'>
            返回
          </Link>
          {canEdit ? (
            <Link className={`${styles.actionLink} ${styles.primary}`} href={`/market/coupon/update/${coupon.id}`}>
              编辑
            </Link>
          ) : null}
        </div>
      }
    >
      <CouponForm mode='detail' initialValues={coupon} />
    </PageContainer>
  );
}
