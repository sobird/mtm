'use client';

import { useQuery } from '@tanstack/react-query';
import type { CSSProperties } from 'react';

import { Card, Empty, Skeleton, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { NO_PERMISSION_MESSAGE } from '@/lib/messages';
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
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.productSelling,
    queryFn: () => apiFetch<SellingResponse>('/api/product/selling'),
  });

  let content;

  if (isPending) {
    content = <Skeleton rows={2} />;
  } else if (isError) {
    content = <Empty description='加载失败' />;
  } else {
    content = (
      <div className={styles.tiles}>
        <button type='button' className={styles.tile} onClick={() => toast.error(NO_PERMISSION_MESSAGE)}>
          <span className={styles.countLine}>
            <span className={styles.count}>{data?.total ?? '--'}</span>件
          </span>
          <span className={styles.caption}>在售中</span>
        </button>
        <button type='button' className={styles.tile} onClick={() => toast.error(NO_PERMISSION_MESSAGE)}>
          <span className={styles.addIcon} aria-hidden='true'>
            +
          </span>
          <span className={styles.caption}>创建新商品</span>
        </button>
      </div>
    );
  }

  return (
    <div style={style}>
      <Card className={className} title='商品管理'>
        <div style={bodyStyle}>{content}</div>
      </Card>
    </div>
  );
}

export default ProductManage;
