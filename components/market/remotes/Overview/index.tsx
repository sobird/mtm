'use client';

import { useQuery } from '@tanstack/react-query';
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
  title: string;
  tips?: string;
  key: keyof WorkbenchOverviewDTO;
  unit: string;
}

const overviewMetrics: OverviewMetric[] = [
  {
    title: '待付款',
    key: 'unpaidOrderCount',
    unit: '单',
  },
  {
    title: '待发货',
    tips: '近90天内的所有待发货订单数',
    key: 'unfilledOrderCount',
    unit: '单',
  },
  {
    title: '退款/售后',
    tips: '近90天所有处在售后和退款中的订单数',
    key: 'refundOrderCount',
    unit: '单',
  },
  {
    title: '即将延迟发货',
    tips: '近90天数据即将会延迟发货的订单数',
    key: 'willDelayDeliverOrderCount',
    unit: '单',
  },
  {
    title: '已延期发货',
    tips: '近90天已过承诺发货时间的订单数',
    key: 'delayedDeliverOrderCount',
    unit: '单',
  },
];

export function Overview({ className, style, bodyStyle }: OverviewProps) {
  const { data, isError } = useQuery({
    queryKey: queryKeys.analysis('workbench'),
    queryFn: () => apiFetch<WorkbenchDTO>('/api/analysis/workbench'),
  });

  const overview = data?.overview;

  return (
    <div style={style}>
      <Card className={className} title='订单概况'>
        <div className={styles.panel} style={bodyStyle}>
          {isError ? (
            <Empty description='加载失败' />
          ) : (
            overviewMetrics.map(metric => {
              const value = overview?.[metric.key];

              return (
                <div className={styles.tile} key={metric.key}>
                  <div className={styles.tileTitle}>
                    {metric.tips ? (
                      <Tooltip content={metric.tips}>
                        <span className={styles.tooltipTitle}>{metric.title}</span>
                      </Tooltip>
                    ) : (
                      <span>{metric.title}</span>
                    )}
                  </div>
                  <div className={styles.tileValue}>
                    <span className={styles.value}>{value ?? '--'}</span>
                    <span className={styles.unit}>{metric.unit}</span>
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
