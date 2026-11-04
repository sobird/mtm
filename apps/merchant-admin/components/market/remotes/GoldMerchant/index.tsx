'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { Card, Empty, Skeleton } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { GoldDTO } from '@/lib/services/gold';

import styles from './GoldMerchant.module.css';

export interface GoldMerchantProps {
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

interface StatusConfig {
  value: number;
  labelKey: string;
  style: CSSProperties;
}

const statusConfig: StatusConfig[] = [
  {
    value: 1,
    labelKey: 'online',
    style: { color: '#333', backgroundImage: 'linear-gradient(to bottom right, #ffe04c, #ffc54d)' },
  },
  { value: 2, labelKey: 'hidden', style: { backgroundColor: '#9f9f9f' } },
  { value: 3, labelKey: 'canceled', style: { backgroundColor: '#ff4338' } },
  { value: 4, labelKey: 'hidden', style: { backgroundColor: '#9f9f9f' } },
];

function formatCycle(value: string | undefined): string {
  return value ? dayjs(value).format('MM-DD') : '--';
}

export function GoldMerchant({ className, style, bodyStyle }: GoldMerchantProps) {
  const t = useTranslations('dashboard.gold');
  const tCommon = useTranslations('common');
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.gold,
    queryFn: () => apiFetch<GoldDTO>('/api/merchant/gold'),
  });

  const lastPeriodStatus = data?.lastPeriodStatus;
  const status = statusConfig.find(item => item.value === lastPeriodStatus);

  let content;

  if (isPending) {
    content = <Skeleton rows={3} />;
  } else if (isError) {
    content = <Empty description={tCommon('loadFailed')} />;
  } else {
    content = (
      <>
        <div className={styles.head}>
          <span className={`${styles.logo} ${lastPeriodStatus === 1 ? '' : styles.logoDim}`} aria-hidden='true'>
            {t('logo')}
          </span>
          <div className={styles.headText}>
            <div className={styles.headTitle}>
              <h3 className={styles.title}>{t('title')}</h3>
              {status ? (
                <span className={styles.status} style={status.style}>
                  {t(status.labelKey)}
                </span>
              ) : null}
            </div>
            <div className={styles.cycle}>
              <span className={styles.cycleRange}>
                {t('cycleRange', {
                  range: `${formatCycle(data?.currentPeriodSTime)} - ${formatCycle(data?.currentPeriodETime)}`,
                })}
              </span>
              <span className={styles.cycleStatus}>{t('assessing')}</span>
            </div>
          </div>
        </div>
        <div className={styles.body}>
          <div className={styles.bodyHead}>
            <span className={styles.bodyTitle}>{t('detailTitle')}</span>
            <span className={styles.bodyDesc}>{t('partialHint')}</span>
            <span className={styles.bodyMore}>{t('moreMetrics')}</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope='col'>{t('columnName')}</th>
                <th scope='col'>{t('columnStandard')}</th>
                <th scope='col'>{t('columnStatus')}</th>
                <th scope='col'>{t('columnQualified')}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.standards ?? []).map(row => (
                <tr key={row.key}>
                  <td>{row.name}</td>
                  <td>{row.desc}</td>
                  <td>
                    {row.url ? (
                      <a className={styles.progressLink} href={row.url} target='_blank' rel='noreferrer'>
                        {row.progress}
                      </a>
                    ) : (
                      <span>{row.progress}</span>
                    )}
                  </td>
                  <td>
                    {row.qualified === 1 ? (
                      <span className={styles.qualified} aria-label={t('qualified')}>
                        ✓
                      </span>
                    ) : (
                      <span className={styles.unqualified} aria-label={t('unqualified')}>
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <div style={style}>
      <Card
        className={className}
        title={t('title')}
        extra={<span className={styles.extraLink}>{t('viewDetail')}</span>}
      >
        <div style={bodyStyle}>{content}</div>
      </Card>
    </div>
  );
}

export default GoldMerchant;
