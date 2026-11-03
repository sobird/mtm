'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
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
  label: string;
  style: CSSProperties;
}

const statusConfig: StatusConfig[] = [
  {
    value: 1,
    label: '线上展示中',
    style: { color: '#333', backgroundImage: 'linear-gradient(to bottom right, #ffe04c, #ffc54d)' },
  },
  { value: 2, label: '线上不展示', style: { backgroundColor: '#9f9f9f' } },
  { value: 3, label: '因违规取消线上展示', style: { backgroundColor: '#ff4338' } },
  { value: 4, label: '线上不展示', style: { backgroundColor: '#9f9f9f' } },
];

const RULES_URL = 'https://rules-center.meituan.com/rules-detail/445?commonType=2';

function formatCycle(value: string | undefined): string {
  return value ? dayjs(value).format('MM-DD') : '--';
}

export function GoldMerchant({ className, style, bodyStyle }: GoldMerchantProps) {
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.gold,
    queryFn: () => apiFetch<GoldDTO>('/api/merchant/gold'),
  });

  const lastPeriodStatus = data?.lastPeriodStatus;
  const status = statusConfig.find(item => item.value === lastPeriodStatus);
  const logoSrc = lastPeriodStatus === 1 ? '/market/gold-logo-inshow.png' : '/market/gold-logo-noshow.png';

  let content;

  if (isPending) {
    content = <Skeleton rows={3} />;
  } else if (isError) {
    content = <Empty description='加载失败' />;
  } else {
    content = (
      <>
        <div className={styles.head}>
          <img className={styles.logo} src={logoSrc} alt='金牌商家' />
          <div className={styles.headText}>
            <div className={styles.headTitle}>
              <h3 className={styles.title}>金牌商家</h3>
              {status ? (
                <span className={styles.status} style={status.style}>
                  {status.label}
                </span>
              ) : null}
            </div>
            <div className={styles.cycle}>
              <span className={styles.cycleRange}>
                当前考核周期:{formatCycle(data?.currentPeriodSTime)} - {formatCycle(data?.currentPeriodETime)}
              </span>
              <span className={styles.cycleStatus}>正在考核中</span>
            </div>
          </div>
        </div>
        <div className={styles.body}>
          <div className={styles.bodyHead}>
            <span className={styles.bodyTitle}>当前考核详情</span>
            <span className={styles.bodyDesc}>以下仅是部分指标</span>
            <span className={styles.bodyMore}>查看更多指标细节</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope='col'>指标名称</th>
                <th scope='col'>认证标准</th>
                <th scope='col'>当前状态</th>
                <th scope='col'>是否达标</th>
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
                      <span className={styles.qualified} aria-label='已达标'>
                        ✓
                      </span>
                    ) : (
                      <span className={styles.unqualified} aria-label='未达标'>
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
        title='金牌商家'
        extra={
          <a className={styles.extraLink} href={RULES_URL} target='_blank' rel='noreferrer'>
            查看详情
          </a>
        }
      >
        <div style={bodyStyle}>{content}</div>
      </Card>
    </div>
  );
}

export default GoldMerchant;
