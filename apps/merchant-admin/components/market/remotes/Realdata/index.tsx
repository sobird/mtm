'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import type { CSSProperties } from 'react';

import { Card, Empty, Tooltip } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { WorkbenchDTO, WorkbenchRealdataDTO } from '@/lib/services/analysis';

import styles from './Realdata.module.css';

export interface RealdataProps {
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

type UnitKey = 'yuan' | 'order' | 'person' | 'times' | '%';

interface RealdataMetric {
  titleKey: string;
  tipKey: string;
  key: keyof WorkbenchRealdataDTO;
  unit: UnitKey;
  showConversionLink?: boolean;
}

const realdataRow1: RealdataMetric[] = [
  {
    titleKey: 'paidAmount',
    tipKey: 'paidAmountTip',
    key: 'paidAmount',
    unit: 'yuan',
  },
  {
    titleKey: 'paidOrderCount',
    tipKey: 'paidOrderCountTip',
    key: 'paidOrderCount',
    unit: 'order',
  },
  {
    titleKey: 'paidUserCount',
    tipKey: 'paidUserCountTip',
    key: 'paidUserCount',
    unit: 'person',
  },
];

const realdataRow2: RealdataMetric[] = [
  {
    titleKey: 'itemUniqueVisitor',
    tipKey: 'itemUniqueVisitorTip',
    key: 'itemUniqueVisitor',
    unit: 'person',
  },
  {
    titleKey: 'itemPaveView',
    tipKey: 'itemPaveViewTip',
    key: 'itemPaveView',
    unit: 'times',
  },
  {
    titleKey: 'conversionRate',
    tipKey: 'conversionRateTip',
    key: 'conversionRate',
    unit: '%',
    showConversionLink: true,
  },
];

function formatValue(metric: RealdataMetric, value: number | undefined, formatter: Intl.NumberFormat): string | number {
  if (value === undefined) {
    return '--';
  }

  return metric.key === 'paidAmount' ? formatter.format(value) : value;
}

export function Realdata({ className, style, bodyStyle }: RealdataProps) {
  const t = useTranslations('dashboard.realdata');
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { data, isError } = useQuery({
    queryKey: queryKeys.analysis('workbench'),
    queryFn: () => apiFetch<WorkbenchDTO>('/api/analysis/workbench'),
  });

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale]
  );

  const realdata = data?.realdata;
  const label = (unit: UnitKey) => (unit === '%' ? '%' : tDashboard(`units.${unit}`));

  return (
    <div style={style}>
      <Card className={className} title={t('title')} extra={<a className={styles.extraLink}>{t('dataCenter')}</a>}>
        <div style={bodyStyle}>
          <p className={styles.description}>{t('description')}</p>
          {isError ? (
            <Empty description={tCommon('loadFailed')} />
          ) : (
            <div className={styles.rows}>
              <div className={styles.row}>
                {realdataRow1.map(metric => (
                  <div className={styles.tile} key={metric.key}>
                    <div className={styles.tileTitle}>
                      <Tooltip content={t(metric.tipKey)}>
                        <span className={styles.tooltipTitle}>{t(metric.titleKey)}</span>
                      </Tooltip>
                    </div>
                    <div className={styles.tileValue}>
                      <span className={styles.value}>{formatValue(metric, realdata?.[metric.key], formatter)}</span>
                      <span className={styles.unit}>{label(metric.unit)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.row}>
                {realdataRow2.map(metric => (
                  <div className={styles.tile} key={metric.key}>
                    <div className={styles.tileTitle}>
                      <Tooltip content={t(metric.tipKey)}>
                        <span className={styles.tooltipTitle}>{t(metric.titleKey)}</span>
                      </Tooltip>
                    </div>
                    <div className={styles.tileValue}>
                      <span className={styles.value}>{formatValue(metric, realdata?.[metric.key], formatter)}</span>
                      <span className={styles.unit}>{label(metric.unit)}</span>
                    </div>
                    {metric.showConversionLink ? (
                      <div>
                        <a className={styles.metricExtra}>{t('improveConversion')}</a>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default Realdata;
