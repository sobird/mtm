/**
 * 违规情况 卡片组件
 *
 * sobird<i@sobird.me> at 2023/10/13 14:52:34 created.
 */

import React, {ComponentProps} from 'react';
import Card from '../workbench/components/card';
import ViolationService, { IViolationOverviewResponse } from '@/services/violation';
import './index.scss';
import { useEffect, useState } from 'react';

const violationsConfig = [
  {
    title: '违规数量(当天)',
    key: 'issueCount',
    unit: '条',
    format: 'money',
  },
  {
    title: '违规待申诉数量',
    key: 'appealCount',
    unit: '条',
    format: 'number',
  },
  {
    title: '罚款金额(当月)',
    key: 'ticketAmount',
    unit: '元',
    format: 'number',
  },
];

export interface ViolationsCardProps extends ComponentProps<typeof Card> {
  callback?: (data: any, type?: string) => any;
}

const ViolationsCard: React.FC<ViolationsCardProps> = ({ callback, ...props}) => {
  const [data, setData] = useState<Partial<IViolationOverviewResponse>>({});
  const poiId = 123;

  useEffect(() => {
    ViolationService.overview(poiId).then(res => {
      setData(res);
      callback?.(res);
    });
  }, [poiId]);

  return (
    <Card
      className='violations-card'
      title='违规情况'
      extra={
        <a href='#/violation/info' target='_blank'>
          违规列表
        </a>
      }
      {...props}
    >
      {violationsConfig.map(item => (
        <Card.View key={item.key} title={item.title} unit={item.unit} value={data[item.key]}></Card.View>
      ))}
    </Card>
  );
};

export default ViolationsCard;
