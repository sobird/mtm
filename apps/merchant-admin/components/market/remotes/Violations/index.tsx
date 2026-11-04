'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { Card, Empty, Skeleton } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { ViolationOverviewDTO } from '@/lib/services/violation';

import styles from './Violations.module.css';

export interface ViolationsProps {
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

type UnitKey = 'record' | 'yuan';

interface ViolationMetric {
  titleKey: string;
  key: keyof ViolationOverviewDTO;
  unit: UnitKey;
}

const violationMetrics: ViolationMetric[] = [
  { titleKey: 'issueCount', key: 'issueCount', unit: 'record' },
  { titleKey: 'appealCount', key: 'appealCount', unit: 'record' },
  { titleKey: 'ticketAmount', key: 'ticketAmount', unit: 'yuan' },
];

export function Violations({ className, style, bodyStyle }: ViolationsProps) {
  const t = useTranslations('dashboard.violations');
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.violationOverview,
    queryFn: () => apiFetch<ViolationOverviewDTO>('/api/violation/overview'),
  });

  let content;

  if (isPending) {
    content = <Skeleton rows={2} />;
  } else if (isError) {
    content = <Empty description={tCommon('loadFailed')} />;
  } else {
    content = (
      <div className={styles.metrics}>
        {violationMetrics.map(metric => (
          <div className={styles.tile} key={metric.key}>
            <div className={styles.tileTitle}>{t(metric.titleKey)}</div>
            <div className={styles.tileValue}>
              <span className={styles.value}>{data?.[metric.key] ?? '--'}</span>
              <span className={styles.unit}>{tDashboard(`units.${metric.unit}`)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={style}>
      <Card className={className} title={t('title')} extra={<span className={styles.extraLink}>{t('listLink')}</span>}>
        <div style={bodyStyle}>{content}</div>
      </Card>
    </div>
  );
}

export default Violations;
