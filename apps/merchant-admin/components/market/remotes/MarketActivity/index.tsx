'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('dashboard.activity');
  const tCommon = useTranslations('common');
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
    content = <Empty description={tCommon('loadFailed')} />;
  } else if (list.length === 0) {
    content = <Empty description={type === '1' ? t('emptyOngoing') : t('emptyMine')} />;
  } else {
    content = (
      <div className={styles.list}>
        {list.map(item => {
          const actionLabel = type === '1' ? t('signupNow') : t('viewDetail');

          return (
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
                    {t('signupTime', { start: item.startTimeStr, end: item.endTimeStr })}
                  </div>
                </div>
              </div>
              <div className={styles.side}>
                <Link
                  className={styles.action}
                  href='/market/home'
                  aria-label={t('actionAria', { action: actionLabel, name: item.name })}
                >
                  {actionLabel}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={style}>
      <Card
        className={className}
        title={t('title')}
        extra={
          <Link className={styles.more} href='/market'>
            {t('more')}
          </Link>
        }
      >
        <div style={bodyStyle}>
          <Tabs
            className={styles.tabs}
            value={type}
            onChange={key => setType(key as CampaignType)}
            items={[
              { key: '1', label: t('tabOngoing'), children: content },
              { key: '2', label: t('tabMine'), children: content },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}

export default MarketActivity;
