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

  return (
    <PageContainer
      title='创建优惠券'
      breadcrumbs={[
        { label: '首页', href: '/' },
        { label: '营销中心' },
        { label: '优惠券', href: '/market/coupons' },
        { label: '创建优惠券' },
      ]}
      actions={
        <div className={styles.actions}>
          <Link className={styles.actionLink} href='/market/coupons'>
            返回
          </Link>
        </div>
      }
    >
      <CouponForm mode='create' target={target} />
    </PageContainer>
  );
}
