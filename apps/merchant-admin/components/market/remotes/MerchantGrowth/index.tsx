'use client';

import type { Translate } from '@mtm/i18n';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import type { CSSProperties } from 'react';

import { Card, Empty, Popover, Skeleton, Tag, Tooltip } from '@/components/ui';
import type { TagTone } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { OperationDTO, OperationRateSetDTO } from '@/lib/services/analysis';
import type { MerchantDTO } from '@/lib/services/merchant';
import type { MerchantTaskDTO } from '@/lib/services/merchant-task';

import styles from './MerchantGrowth.module.css';

export interface MerchantGrowthProps {
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

type ScoreKey = 'serviceScore' | 'overallScore';

interface SubMetric {
  titleKey: string;
  key: keyof OperationRateSetDTO;
  unit: '%' | 'record';
}

interface ScoreConfig {
  titleKey: string;
  tipKey: string;
  subData: SubMetric[];
}

const scoreConfig: Record<ScoreKey, ScoreConfig> = {
  serviceScore: {
    titleKey: 'serviceScore',
    tipKey: 'serviceScoreTip',
    subData: [
      { titleKey: 'replyRate', key: 'customerReplyRate', unit: '%' },
      { titleKey: 'collectRate', key: 'collectOnTimeRate', unit: '%' },
    ],
  },
  overallScore: {
    titleKey: 'overallScore',
    tipKey: 'overallScoreTip',
    subData: [{ titleKey: 'newReviews', key: 'newlyReviewCount', unit: 'record' }],
  },
};

const SHOP_JUMP_URL = process.env.NEXT_PUBLIC_SHOP_JUMP_URL ?? '/';

function formatScore(score: number | undefined): string {
  if (score === undefined || score === null) {
    return '--';
  }

  return score.toFixed(2);
}

function formatRate(value: number | undefined, unit: '%' | 'record', t: Translate): string {
  if (value === undefined || value === null) {
    return '--';
  }

  if (unit === '%') {
    return `${(value * 100).toFixed(2)}%`;
  }

  return `${value}${t(`units.${unit}`)}`;
}

function getScoreTag(
  type: ScoreKey,
  score: number | undefined,
  judge: number,
  t: Translate
): { label: string; tone: TagTone } | null {
  if (score === undefined || score === null) {
    return null;
  }

  if (type === 'serviceScore') {
    return score >= judge ? { label: t('excellent'), tone: 'success' } : { label: t('notExcellent'), tone: 'danger' };
  }

  if (score === 0) {
    return { label: t('notCounted'), tone: 'neutral' };
  }

  return score >= judge ? { label: t('normal'), tone: 'success' } : { label: t('warning'), tone: 'danger' };
}

function renderShopName(name: string | undefined, fallback: string) {
  const value = name || fallback;

  if (value.length > 10) {
    return (
      <Tooltip content={value}>
        <span>{`${value.substring(0, 10)}...`}</span>
      </Tooltip>
    );
  }

  return value;
}

export function MerchantGrowth({ className, style, bodyStyle }: MerchantGrowthProps) {
  const t = useTranslations('dashboard.growth');
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const {
    data: operation,
    isPending,
    isError,
  } = useQuery({
    queryKey: queryKeys.analysis('operation'),
    queryFn: () => apiFetch<OperationDTO>('/api/analysis/operation'),
  });
  const { data: tasks } = useQuery({
    queryKey: queryKeys.merchantTasks,
    queryFn: () => apiFetch<MerchantTaskDTO[]>('/api/merchant/task/list'),
  });
  const { data: merchant } = useQuery({
    queryKey: queryKeys.merchant,
    queryFn: () => apiFetch<MerchantDTO>('/api/merchant/detail'),
  });

  const shopName = merchant?.name;
  const taskCount = tasks?.[0]?.curTaskCount ?? 0;
  const awardCount = tasks?.[0]?.curAwardCount ?? 0;

  let content;

  if (isPending) {
    content = <Skeleton rows={4} />;
  } else if (isError) {
    content = <Empty description={tCommon('loadFailed')} />;
  } else {
    content = (
      <div className={styles.cards}>
        {(Object.keys(scoreConfig) as ScoreKey[]).map(type => {
          const config = scoreConfig[type];
          const score = operation?.scoreSet?.[type];
          const judge =
            type === 'serviceScore'
              ? operation?.scoreSet?.serviceScoreJudge || 4
              : operation?.scoreSet?.overallScoreJudge || 4;
          const tag = getScoreTag(type, score, judge, t);

          return (
            <div className={styles.card} key={type}>
              <div className={styles.cardTitle}>
                <span className={styles.cardName}>{t(config.titleKey)}</span>
                {tag ? <Tag tone={tag.tone}>{tag.label}</Tag> : null}
              </div>
              <div className={styles.scoreWrap}>
                <Tooltip content={t(config.tipKey)}>
                  <div className={styles.score}>
                    {formatScore(score)}
                    <span>{tDashboard('units.points')}</span>
                  </div>
                </Tooltip>
                {typeof score !== 'number' ? <p className={styles.noData}>{t('calculating')}</p> : null}
              </div>
              <div className={styles.notes}>
                <div className={styles.tip}>{t('focusHint')}</div>
                {config.subData.map(item => (
                  <p className={styles.important} key={item.key}>
                    {t(item.titleKey)}: {formatRate(operation?.rateSet?.[item.key], item.unit, tDashboard)}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  let taskText;

  if (taskCount > 0 || awardCount > 0) {
    taskText = (
      <span className={styles.taskLinks}>
        {taskCount > 0 ? <span className={styles.linkText}>{t('taskPending', { count: taskCount })}</span> : null}
        {taskCount > 0 && awardCount > 0 ? t('taskSeparator') : null}
        {awardCount > 0 ? <span className={styles.linkText}>{t('taskAward', { count: awardCount })}</span> : null}
      </span>
    );
  } else {
    taskText = <span className={styles.linkText}>{t('title')}</span>;
  }

  return (
    <div style={style}>
      <Card
        className={className}
        title={renderShopName(shopName, t('defaultShopName'))}
        extra={
          <div className={styles.extra}>
            {taskText}
            <Popover
              trigger={
                <button type='button' className={styles.qrTrigger}>
                  {t('qrcode')}
                </button>
              }
            >
              <div className={styles.qrcode}>
                <p className={styles.qrcodeTitle}>{shopName || t('qrcodeTitle')}</p>
                <p className={styles.qrcodeDesc}>{t('qrcodeDesc')}</p>
                <QRCodeSVG size={100} value={SHOP_JUMP_URL} />
              </div>
            </Popover>
          </div>
        }
      >
        <div style={bodyStyle}>{content}</div>
      </Card>
    </div>
  );
}

export default MerchantGrowth;
