'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { Card, Empty, Tooltip } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { WorkbenchDTO, WorkbenchOverviewDTO } from '@/lib/services/analysis';

import styles from './Overview.module.css';

export interface OverviewProps {
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

interface OverviewMetric {
  titleKey: string;
  tipKey?: string;
  key: keyof WorkbenchOverviewDTO;
}

const overviewMetrics: OverviewMetric[] = [
  {
    titleKey: 'unpaid',
    key: 'unpaidOrderCount',
  },
  {
    titleKey: 'unfilled',
    tipKey: 'unfilledTip',
    key: 'unfilledOrderCount',
  },
  {
    titleKey: 'refund',
    tipKey: 'refundTip',
    key: 'refundOrderCount',
  },
  {
    titleKey: 'willDelay',
    tipKey: 'willDelayTip',
    key: 'willDelayDeliverOrderCount',
  },
  {
    titleKey: 'delayed',
    tipKey: 'delayedTip',
    key: 'delayedDeliverOrderCount',
  },
];

export function Overview({ className, style, bodyStyle }: OverviewProps) {
  const t = useTranslations('dashboard.overview');
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { data, isError } = useQuery({
    queryKey: queryKeys.analysis('workbench'),
    queryFn: () => apiFetch<WorkbenchDTO>('/api/analysis/workbench'),
  });

  const overview = data?.overview;

  return (
    <div style={style}>
      <Card className={className} title={t('title')}>
        <div className={styles.panel} style={bodyStyle}>
          {isError ? (
            <Empty description={tCommon('loadFailed')} />
          ) : (
            overviewMetrics.map(metric => {
              const value = overview?.[metric.key];

              return (
                <div className={styles.tile} key={metric.key}>
                  <div className={styles.tileTitle}>
                    {metric.tipKey ? (
                      <Tooltip content={t(metric.tipKey)}>
                        <span className={styles.tooltipTitle}>{t(metric.titleKey)}</span>
                      </Tooltip>
                    ) : (
                      <span>{t(metric.titleKey)}</span>
                    )}
                  </div>
                  <div className={styles.tileValue}>
                    <span className={styles.value}>{value ?? '--'}</span>
                    <span className={styles.unit}>{tDashboard('units.order')}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

export default Overview;
