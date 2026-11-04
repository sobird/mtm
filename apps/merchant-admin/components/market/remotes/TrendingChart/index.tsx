'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useLocale, useTranslations } from 'next-intl';
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
type UnitKey = 'item' | 'yuan' | 'times' | '%';

interface LineChartConfig {
  titleKey: string;
  key: MetricKey;
  unit: UnitKey;
}

const lineChartConfig: LineChartConfig[] = [
  { titleKey: 'lineTransaction', key: 'transactionLine', unit: 'item' },
  { titleKey: 'linePaymentAmount', key: 'paymentAmountLine', unit: 'yuan' },
  { titleKey: 'lineReview', key: 'reviewLine', unit: 'times' },
  { titleKey: 'lineServiceReplyRate', key: 'serviceReplyRateLine', unit: '%' },
];

const rangeConfig: { key: RangeKey; labelKey: string }[] = [
  { key: 'last7', labelKey: 'range7' },
  { key: 'last30', labelKey: 'range30' },
];

function formatterLineChartY(raw: number | string, unit: UnitKey, locale: string): string {
  const value = Number(raw);

  if (unit === '%') {
    return `${value.toFixed()}%`;
  }

  if (value >= 10000) {
    return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  }

  return String(value);
}

function formatTooltipValue(raw: unknown, unit: UnitKey, unitLabel: string): string {
  const value = Number(raw);

  if (unit === '%') {
    return `${value.toFixed(2)}%`;
  }

  if (unit === 'yuan') {
    return `${value.toFixed(2)}${unitLabel}`;
  }

  return `${raw as string}${unitLabel}`;
}

export function TrendingChart({ className, style, bodyStyle }: TrendingChartProps) {
  const t = useTranslations('dashboard.trending');
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [metricKey, setMetricKey] = useState<MetricKey>(lineChartConfig[0].key);
  const [rangeKey, setRangeKey] = useState<RangeKey>('last30');

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.analysis(`trending:${rangeKey}`),
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
  const currentTitle = t(currentConf.titleKey);
  const currentUnit = currentConf.unit === '%' ? '%' : tDashboard(`units.${currentConf.unit}`);
  const points = data?.[metricKey] ?? [];

  let chart;

  if (isPending) {
    chart = <Skeleton rows={4} />;
  } else if (isError) {
    chart = <Empty description={tCommon('loadFailed')} />;
  } else if (points.length === 0) {
    chart = <Empty description={t('noData')} />;
  } else {
    chart = (
      <ResponsiveContainer width='100%' height={214}>
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
          <XAxis dataKey='date' tick={{ fontSize: 12 }} />
          <YAxis
            width={56}
            tick={{ fontSize: 12 }}
            tickFormatter={value => formatterLineChartY(value, currentConf.unit, locale)}
          />
          <RechartsTooltip
            formatter={value =>
              [formatTooltipValue(value, currentConf.unit, currentUnit), currentTitle] as [string, string]
            }
          />
          <Line type='monotone' dataKey='value' name={currentTitle} stroke='#0080ff' dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <div style={style}>
      <Card
        className={className}
        title={t('title')}
        extra={
          <div className={styles.ranges}>
            {rangeConfig.map(item => (
              <button
                key={item.key}
                type='button'
                className={cx(styles.range, rangeKey === item.key && styles.active)}
                aria-pressed={rangeKey === item.key}
                onClick={() => setRangeKey(item.key)}
              >
                {t(item.labelKey)}
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
                aria-pressed={metricKey === item.key}
                onClick={() => setMetricKey(item.key)}
              >
                {t(item.titleKey)}
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
