'use client';

import { useQuery } from '@tanstack/react-query';
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
  title: string;
  key: keyof OperationRateSetDTO;
  unit: '%' | '条';
}

interface ScoreConfig {
  title: string;
  tips: string;
  subData: SubMetric[];
}

const scoreConfig: Record<ScoreKey, ScoreConfig> = {
  serviceScore: {
    title: '服务评价分',
    tips: '平台从售后、物流、客服、纠纷四个维度对商家的整体服务分进行评估的数据指标。服务分达到4分及以上的商家为优秀商家。',
    subData: [
      { title: '近30天3分钟回复率', key: 'customerReplyRate', unit: '%' },
      { title: '近30天发货及揽收准时率', key: 'collectOnTimeRate', unit: '%' },
    ],
  },
  overallScore: {
    title: '综合评价分',
    tips: '综合评价分为近30天店铺下所有主动评价的订单分数的平均值。有效评价数不足20个的店铺暂不统计评分，综合评价分为0；低于4.0分属于异常。',
    subData: [{ title: '新增评价数', key: 'newlyReviewCount', unit: '条' }],
  },
};

const SHOP_JUMP_URL = `${process.env.NEXT_PUBLIC_SHOP_JUMP_URL ?? 'https://mtm.meituan.com/datacenter/middle.html'}?env=prod&poiId=148568&g_source=682`;

function formatScore(score: number | undefined): string {
  if (score === undefined || score === null) {
    return '--';
  }

  return score.toFixed(2);
}

function formatRate(value: number | undefined, unit: '%' | '条'): string {
  if (value === undefined || value === null) {
    return '--';
  }

  if (unit === '%') {
    return `${(value * 100).toFixed(2)}%`;
  }

  return `${value}${unit}`;
}

function getScoreTag(
  type: ScoreKey,
  score: number | undefined,
  judge: number
): { label: string; tone: TagTone } | null {
  if (score === undefined || score === null) {
    return null;
  }

  if (type === 'serviceScore') {
    return score >= judge ? { label: '已达到优秀商家', tone: 'success' } : { label: '未达到优秀商家', tone: 'danger' };
  }

  if (score === 0) {
    return { label: '暂未统计', tone: 'neutral' };
  }

  return score >= judge ? { label: '正常', tone: 'success' } : { label: '预警', tone: 'danger' };
}

function renderShopName(name: string | undefined) {
  const value = name || '商家经营';

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
    content = <Empty description='加载失败' />;
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
          const tag = getScoreTag(type, score, judge);

          return (
            <div className={styles.card} key={type}>
              <div className={styles.cardTitle}>
                <span className={styles.cardName}>{config.title}</span>
                <Tooltip content={config.tips}>
                  <span className={styles.help} aria-hidden='true'>
                    ?
                  </span>
                </Tooltip>
                {tag ? <Tag tone={tag.tone}>{tag.label}</Tag> : null}
              </div>
              <div className={styles.scoreWrap}>
                <Tooltip content={config.tips}>
                  <div className={styles.score}>
                    {formatScore(score)}
                    <span>分</span>
                  </div>
                </Tooltip>
                {typeof score !== 'number' ? <p className={styles.noData}>（计算中...）</p> : null}
              </div>
              <div className={styles.notes}>
                <div className={styles.tip}>请重点关注以下数据:</div>
                {config.subData.map(item => (
                  <p className={styles.important} key={item.key}>
                    {item.title}: {formatRate(operation?.rateSet?.[item.key], item.unit)}
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
        {taskCount > 0 ? <span className={styles.linkText}>有{taskCount}个任务待完成</span> : null}
        {taskCount > 0 && awardCount > 0 ? '，' : null}
        {awardCount > 0 ? <span className={styles.linkText}>有{awardCount}个奖励待查看</span> : null}
      </span>
    );
  } else {
    taskText = <span className={styles.linkText}>商家成长</span>;
  }

  return (
    <div style={style}>
      <Card
        className={className}
        title={renderShopName(shopName)}
        extra={
          <div className={styles.extra}>
            {taskText}
            <Popover
              trigger={
                <button type='button' className={styles.qrTrigger}>
                  二维码
                </button>
              }
            >
              <div className={styles.qrcode}>
                <p className={styles.qrcodeTitle}>{shopName || '店铺二维码'}</p>
                <p className={styles.qrcodeDesc}>打开美团App扫码查看店铺详情</p>
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
