/**
 * 营销活动 卡片组件
 *
 * @todo
 *
 * sobird<i@sobird.me> at 2023/09/14 1:53:11 created.
 */

import React, { ComponentProps, useEffect, useState } from 'react';
import { Button, Tabs } from 'antd';
import Empty from '@/components/UI/empty';
import CampaignService, { ICampaignListResponse } from '@/services/campaign';
import Card from '../workbench/components/card/Card';

import './index.scss';

export interface MarketActivityCardProps extends ComponentProps<typeof Card> {
  callback?: (data: any) => any;
  max: number;
}

const MarketActivityCard: React.FC<MarketActivityCardProps> = ({ callback, max = 5, ...props }) => {
  const [type, setStatus] = useState('1');
  const [data, setData] = useState<ICampaignListResponse>();

  useEffect(() => {
    CampaignService.list({
      type,
      max,
    })
      .then(res => {
        setData(res);
      })
      .catch(() => {
        //
      });
  }, [type]);

  return (
    <Card
      classCard='market-activity-card'
      subTitle={
        <Tabs
          onTabClick={key => {
            setStatus(key);
          }}
          items={[
            {
              label: '报名中的活动',
              key: '1',
            },
            {
              label: '我报名的活动',
              key: '2',
            },
          ]}
        />
      }
      extra={<a href="#/market/activity" target="_blank">查看更多</a>}
      {...props}
    >
      {data?.list.length > 0 ? (
        <div className='market-activity-card-list'>
          {data.list.map(item => (
            <div key={item.id} className='market-activity-card-item'>
              <div className='campaign-info'>
                <div className={`campaign-icon campaign-icon-${item.type}`} />
                <div className='campaign-text'>
                  <div className='campaign-title' title={item.name}>
                    {item.name}
                  </div>
                  <div className='campaign-extra'>
                    报名时间：{item.startTimeStr} 至 {item.endTimeStr}
                  </div>
                </div>
              </div>
              <div className='campaign-side'>
                {type === '1' && (
                  <Button
                    onClick={() => {
                      window.open(`/marketing/activity/product-report/${item.id}?type=${item.type}`, '_blank');
                    }}
                  >
                    立即报名
                  </Button>
                )}
                {type === '2' && (
                  <Button
                    onClick={() => {
                      window.open(`/marketing/activity/product-detail/${item.id}?type=${item.type}`, '_blank');
                    }}
                  >
                    查看详情
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty style={{ margin: '116px 0' }} description={`暂无${type === '1' ? '报名中' : '我报名'}的活动`}></Empty>
      )}
    </Card>
  );
};

export default MarketActivityCard;
