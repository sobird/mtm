/**
 * 金牌商家 卡片组件
 *
 * sobird<i@sobird.me> at 2023/10/14 1:04:09 created.
 */

import React, { useEffect, useState, ComponentProps } from 'react';
import { Table } from 'antd';
import dayjs from 'dayjs';

import Card from '../workbench/components/card';
import Done from './assets/green_hook.png';
import UnDo from './assets/gray_hook.png';
import GoldLogoInshow from './assets/gold_logo_inshow.png';
import GoldLogoNoshow from './assets/gold_logo_noshow.png';

import MerchantService, { IGoldResponse } from '@/services/merchant';

import './index.scss';

function toTargetPage(row: any) {
  if (row.pcUrl) {
    window.open(row.pcUrl);
  }
}

interface TagConfigProps {
  value: number;
  label: string;
  style?: React.CSSProperties;
}

const TagConfig: TagConfigProps[] = [
  {
    value: 1,
    label: '线上展示中',
    style: {
      color: '#333',
      backgroundImage: 'linear-gradient(to bottom right, #ffe04c, #ffc54d)',
    },
  },
  {
    value: 2,
    label: '线上不展示',
    style: {
      backgroundColor: '#9f9f9f',
    },
  },
  {
    value: 3,
    label: '因违规取消线上展示',
    style: {
      backgroundColor: '#ff4338',
    },
  },
  {
    value: 4,
    label: '线上不展示',
    style: {
      backgroundColor: '#9f9f9f',
    },
  },
];

export interface GoldMerchantCardProps extends ComponentProps<typeof Card> {
  callback?: () => any;
}
const GoldMerchantCard: React.FC<GoldMerchantCardProps> = ({ callback, ...props }) => {
  const [data, setData] = useState<Partial<IGoldResponse>>({});
  const poild = 123;

  const goldMerchantLogo = data.lastPeriodStatus === 1 ? GoldLogoInshow : GoldLogoNoshow;
  const tagInfo = TagConfig.find(item => item.value === data.lastPeriodStatus);

  useEffect(() => {
    MerchantService.gold({
      poild,
      periodType: 1,
    }).then(res => {
      setData(res);
    });
  }, [poild]);

  return (
    <Card
      title='金牌商家'
      extra={
        <a target='_blank' href='https://rules-center.meituan.com/rules-detail/445?commonType=2'>
          查看详情
        </a>
      }
      className='gold-merchant-card'
      {...props}
    >
      <div className='gold-head'>
        <img className='gold-head-logo' src={goldMerchantLogo} alt='金牌商家' />
        <div className='gold-head-text'>
          <div className='gold-head-text-title'>
            <h3>金牌商家</h3>
            <span style={tagInfo?.style}>{tagInfo?.label}</span>
          </div>
          <div className='gold-head-text-cycle'>
            <span className='gold-head-text-cycle-range'>
              当前考核周期:{dayjs(data?.currentPeriodSTime).format('MM-DD')} -{' '}
              {dayjs(data?.currentPeriodETime).format('MM-DD')}
            </span>
            <span className='gold-head-text-cycle-status'>正在考核中</span>
          </div>
        </div>
      </div>
      <div className='gold-body'>
        <div className='gold-body-head'>
          <span className='gold-body-head-title'>当前考核详情</span>
          <span className='gold-body-head-desc'>以下仅是部分指标</span>
          <a href='#/merchant-growing/gold-merchant' target='_blank' className='gold-body-head-more'>
            查看更多指标细节
          </a>
        </div>

        <Table rowKey='name' bordered dataSource={data.standards} pagination={false} size='small'>
          <Table.Column title='指标名称' dataIndex='name' />
          <Table.Column title='认证标准' dataIndex='desc' />
          <Table.Column
            title='当前状态'
            dataIndex='progress'
            render={(text, record) => {
              return (
                <a href={record.url} onClick={() => toTargetPage(record)}>
                  {record.progress}
                </a>
              );
            }}
          />
          <Table.Column
            title='是否达标'
            dataIndex='qualified'
            render={(text, record) => {
              return (
                <img src={record.qualified === 1 ? Done : UnDo} alt='' style={{ width: '16px', height: '16px' }} />
              );
            }}
          />
        </Table>
      </div>
    </Card>
  );
};
export default GoldMerchantCard;
