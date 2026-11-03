'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, Empty, Skeleton } from '@/components/ui';
import { cx } from '@/components/ui/cx';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { TrendingDTO } from '@/lib/services/analysis';

import styles from './TrendingChart.module.css';

export interface TrendingChartProps {
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

type MetricKey = 'transactionLine' | 'paymentAmountLine' | 'reviewLine' | 'serviceReplyRateLine';
type RangeKey = 'last7' | 'last30';

interface LineChartConfig {
  title: string;
  key: MetricKey;
  unit: '件' | '元' | '次' | '%';
}

const lineChartConfig: LineChartConfig[] = [
  { title: '商品成交件数', key: 'transactionLine', unit: '件' },
  { title: '支付金额', key: 'paymentAmountLine', unit: '元' },
  { title: '评价数', key: 'reviewLine', unit: '次' },
  { title: '3分钟客服回复率', key: 'serviceReplyRateLine', unit: '%' },
];

const rangeConfig: { key: RangeKey; label: string }[] = [
  { key: 'last7', label: '近7天' },
  { key: 'last30', label: '近30天' },
];

function formatterLineChartY(raw: number | string, unit: string): string {
  const value = Number(raw);

  if (unit === '%') {
    return `${value.toFixed()}${unit}`;
  }

  return value >= 10000 ? `${value / 10000}万` : String(value);
}

function formatTooltipValue(raw: unknown, unit: string): string {
  const value = Number(raw);

  if (unit === '%') {
    return `${value.toFixed(2)}%`;
  }

  if (unit === '元') {
    return `${value.toFixed(2)}元`;
  }

  return `${raw as string}${unit}`;
}

export function TrendingChart({ className, style, bodyStyle }: TrendingChartProps) {
  const [metricKey, setMetricKey] = useState<MetricKey>(lineChartConfig[0].key);
  const [rangeKey, setRangeKey] = useState<RangeKey>('last30');

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.analysis('trending'),
    queryFn: () => {
      const now = dayjs();
      const start = rangeKey === 'last7' ? now.subtract(1, 'week') : now.subtract(1, 'month');

      return apiFetch<TrendingDTO>('/api/analysis/trending', {
        query: {
          startTime: start.format('YYYYMMDD'),
          endTime: now.format('YYYYMMDD'),
        },
      });
    },
  });

  const currentConf = lineChartConfig.find(item => item.key === metricKey) ?? lineChartConfig[0];
  const points = data?.[metricKey] ?? [];

  let chart;

  if (isPending) {
    chart = <Skeleton rows={4} />;
  } else if (isError) {
    chart = <Empty description='加载失败' />;
  } else if (points.length === 0) {
    chart = <Empty description='暂无数据' />;
  } else {
    chart = (
      <ResponsiveContainer width='100%' height={214}>
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
          <XAxis dataKey='date' tick={{ fontSize: 12 }} />
          <YAxis
            width={56}
            tick={{ fontSize: 12 }}
            tickFormatter={value => formatterLineChartY(value, currentConf.unit)}
          />
          <RechartsTooltip
            formatter={value => [formatTooltipValue(value, currentConf.unit), currentConf.title] as [string, string]}
          />
          <Line type='monotone' dataKey='value' name={currentConf.title} stroke='#0080ff' dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <div style={style}>
      <Card
        className={className}
        title='经营趋势'
        extra={
          <div className={styles.ranges}>
            {rangeConfig.map(item => (
              <button
                key={item.key}
                type='button'
                className={cx(styles.range, rangeKey === item.key && styles.active)}
                onClick={() => setRangeKey(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      >
        <div style={bodyStyle}>
          <div className={styles.metrics}>
            {lineChartConfig.map(item => (
              <button
                key={item.key}
                type='button'
                className={cx(styles.metric, metricKey === item.key && styles.activeMetric)}
                onClick={() => setMetricKey(item.key)}
              >
                {item.title}
              </button>
            ))}
          </div>
          <div className={styles.chart}>{chart}</div>
        </div>
      </Card>
    </div>
  );
}

export default TrendingChart;
