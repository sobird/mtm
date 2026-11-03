'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { Card, Empty, Skeleton, Tabs } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { CampaignDTO } from '@/lib/services/campaign';

import styles from './MarketActivity.module.css';

export interface MarketActivityProps {
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  max?: number;
}

interface CampaignListResponse {
  total: number;
  list: CampaignDTO[];
}

type CampaignType = '1' | '2';

const KNOWN_ICONS = new Set(['16', '66', '67', '68', '69', '70', '691']);

export function MarketActivity({ className, style, bodyStyle, max = 4 }: MarketActivityProps) {
  const [type, setType] = useState<CampaignType>('1');
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.campaigns({ type }),
    queryFn: () => apiFetch<CampaignListResponse>('/api/merchant/campaigns', { query: { type } }),
  });

  const list = (data?.list ?? []).slice(0, max);

  let content;

  if (isPending) {
    content = <Skeleton rows={3} />;
  } else if (isError) {
    content = <Empty description='加载失败' />;
  } else if (list.length === 0) {
    content = <Empty description={type === '1' ? '暂无报名中的活动' : '暂无我报名的活动'} />;
  } else {
    content = (
      <div className={styles.list}>
        {list.map(item => (
          <div className={styles.item} key={item.id}>
            <div className={styles.info}>
              {KNOWN_ICONS.has(String(item.type)) ? (
                <img className={styles.icon} src={`/market/campaign/${item.type}.png`} alt='' />
              ) : (
                <span className={`${styles.icon} ${styles.iconFallback}`} aria-hidden='true' />
              )}
              <div className={styles.text}>
                <div className={styles.name} title={item.name}>
                  {item.name}
                </div>
                <div className={styles.extra}>
                  报名时间：{item.startTimeStr} 至 {item.endTimeStr}
                </div>
              </div>
            </div>
            <div className={styles.side}>
              <Link
                className={styles.action}
                href='/market/home'
                aria-label={`${type === '1' ? '立即报名' : '查看详情'}：${item.name}`}
              >
                {type === '1' ? '立即报名' : '查看详情'}
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={style}>
      <Card
        className={className}
        title='营销活动'
        extra={
          <Link className={styles.more} href='/market'>
            查看更多
          </Link>
        }
      >
        <div style={bodyStyle}>
          <Tabs
            className={styles.tabs}
            value={type}
            onChange={key => setType(key as CampaignType)}
            items={[
              { key: '1', label: '报名中的活动', children: content },
              { key: '2', label: '我报名的活动', children: content },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}

export default MarketActivity;
