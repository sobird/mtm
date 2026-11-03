'use client';

import { useQuery } from '@tanstack/react-query';
import type { CSSProperties, ReactNode } from 'react';

import { Card, Tooltip } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { WorkbenchDTO, WorkbenchRealdataDTO } from '@/lib/services/analysis';

import styles from './Realdata.module.css';

export interface RealdataProps {
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

interface RealdataMetric {
  title: string;
  tips: string;
  key: keyof WorkbenchRealdataDTO;
  unit: string;
  extra?: ReactNode;
}

const realdataRow1: RealdataMetric[] = [
  {
    title: '支付金额',
    tips: '该店铺支付订单的总金额，包含买家实际支付和使用平台优惠券的总金额，未剔除售后订单',
    key: 'paidAmount',
    unit: '元',
  },
  {
    title: '支付订单数',
    tips: '店铺全部支付的订单数，一个支付订单对应唯一订单号，一个买家在统计时间内支付多个订单则记为多次',
    key: 'paidOrderCount',
    unit: '单',
  },
  {
    title: '支付人数',
    tips: '该店铺所有支付买家的去重人数，即一个买家多次支付，仅记一人，未剔除售后订单',
    key: 'paidUserCount',
    unit: '人',
  },
];

const realdataRow2: RealdataMetric[] = [
  {
    title: '商品访客数',
    tips: '统计周期内，访问店铺所有商品的去重人数',
    key: 'itemUniqueVisitor',
    unit: '人',
  },
  {
    title: '商品浏览量',
    tips: '统计周期内，该店铺内所有商品详情页的被访问累加人次',
    key: 'itemPaveView',
    unit: '次',
  },
  {
    title: '支付转化率',
    tips: '统计周期内，支付买家数/访客数，即访客用户数转化为支付买家的比例',
    key: 'conversionRate',
    unit: '%',
    extra: <a className={styles.metricExtra}>如何提高转化率</a>,
  },
];

const paidAmountFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatValue(metric: RealdataMetric, value: number | undefined): string | number {
  if (value === undefined || value === null) {
    return '--';
  }

  return metric.key === 'paidAmount' ? paidAmountFormatter.format(value) : value;
}

function renderMetric(metric: RealdataMetric, value: number | undefined) {
  return (
    <div className={styles.tile} key={metric.key}>
      <div className={styles.tileTitle}>
        <Tooltip content={metric.tips}>
          <span className={styles.tooltipTitle}>{metric.title}</span>
        </Tooltip>
      </div>
      <div className={styles.tileValue}>
        <span className={styles.value}>{formatValue(metric, value)}</span>
        <span className={styles.unit}>{metric.unit}</span>
      </div>
      {metric.extra ? <div>{metric.extra}</div> : null}
    </div>
  );
}

export function Realdata({ className, style, bodyStyle }: RealdataProps) {
  const { data } = useQuery({
    queryKey: queryKeys.analysis('workbench'),
    queryFn: () => apiFetch<WorkbenchDTO>('/api/analysis/workbench'),
  });

  const realdata = data?.realdata;

  return (
    <div style={style}>
      <Card className={className} title='实时数据' extra={<a className={styles.extraLink}>数据中心</a>}>
        <div style={bodyStyle}>
          <p className={styles.description}>数据计算可能会存在5-10分钟左右的延迟</p>
          <div className={styles.rows}>
            <div className={styles.row}>{realdataRow1.map(metric => renderMetric(metric, realdata?.[metric.key]))}</div>
            <div className={styles.row}>{realdataRow2.map(metric => renderMetric(metric, realdata?.[metric.key]))}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Realdata;
