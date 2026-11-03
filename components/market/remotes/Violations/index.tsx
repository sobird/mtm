'use client';

import { useQuery } from '@tanstack/react-query';
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

interface ViolationMetric {
  title: string;
  key: keyof ViolationOverviewDTO;
  unit: string;
}

const violationMetrics: ViolationMetric[] = [
  { title: '违规数量(当天)', key: 'issueCount', unit: '条' },
  { title: '违规待申诉数量', key: 'appealCount', unit: '条' },
  { title: '罚款金额(当月)', key: 'ticketAmount', unit: '元' },
];

export function Violations({ className, style, bodyStyle }: ViolationsProps) {
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.violationOverview,
    queryFn: () => apiFetch<ViolationOverviewDTO>('/api/violation/overview'),
  });

  let content;

  if (isPending) {
    content = <Skeleton rows={2} />;
  } else if (isError) {
    content = <Empty description='加载失败' />;
  } else {
    content = (
      <div className={styles.metrics}>
        {violationMetrics.map(metric => (
          <div className={styles.tile} key={metric.key}>
            <div className={styles.tileTitle}>{metric.title}</div>
            <div className={styles.tileValue}>
              <span className={styles.value}>{data?.[metric.key] ?? '--'}</span>
              <span className={styles.unit}>{metric.unit}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={style}>
      <Card className={className} title='违规情况' extra={<span className={styles.extraLink}>违规列表</span>}>
        <div style={bodyStyle}>{content}</div>
      </Card>
    </div>
  );
}

export default Violations;
