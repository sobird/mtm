'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { Card, Empty, Skeleton, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { ProductDTO } from '@/lib/services/product';

import styles from './ProductManage.module.css';

export interface ProductManageProps {
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

interface SellingResponse {
  total: number;
  items: ProductDTO[];
}

export function ProductManage({ className, style, bodyStyle }: ProductManageProps) {
  const toast = useToast();
  const t = useTranslations('dashboard.productManage');
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.productSelling,
    queryFn: () => apiFetch<SellingResponse>('/api/product/selling'),
  });

  let content;

  if (isPending) {
    content = <Skeleton rows={2} />;
  } else if (isError) {
    content = <Empty description={tCommon('loadFailed')} />;
  } else {
    content = (
      <div className={styles.tiles}>
        <button type='button' className={styles.tile} onClick={() => toast.error(tCommon('noPermission'))}>
          <span className={styles.countLine}>
            <span className={styles.count}>{data?.total ?? '--'}</span>
            {tDashboard('units.item')}
          </span>
          <span className={styles.caption}>{t('selling')}</span>
        </button>
        <button type='button' className={styles.tile} onClick={() => toast.error(tCommon('noPermission'))}>
          <span className={styles.addIcon} aria-hidden='true'>
            +
          </span>
          <span className={styles.caption}>{t('create')}</span>
        </button>
      </div>
    );
  }

  return (
    <div style={style}>
      <Card className={className} title={t('title')}>
        <div style={bodyStyle}>{content}</div>
      </Card>
    </div>
  );
}

export default ProductManage;
