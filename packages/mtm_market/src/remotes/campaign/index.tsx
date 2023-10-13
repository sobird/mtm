/**
 * 营销活动 模块联邦组件
 * 
 * @todo
 * 活动列表条数可控制
 * 
 * sobird<i@sobird.me> at 2023/09/14 1:53:11 created.
 */

import React, { useEffect, useState } from "react";
import { Button, Tabs } from 'antd';
import Empty from "@/components/UI/empty";
import CampaignService, { ICampaignListResponse } from "@/services/campaign";

import './index.scss';

const Campaign: React.FC = () => {
  const [status, setStatus] = useState('1');
  const [data, setData] = useState<ICampaignListResponse>();

  useEffect(() => {
    CampaignService.list({
      status
    }).then(res => {
      setData(res)
    }).catch(() => {
      // 
    });
  }, [status]);

  return (
    <div className="mtm-market-campaign">
      <div className="mtm-market-campaign-tabs">
        <Tabs
          onTabClick={(key) => {
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
      </div>

      {data?.list.length > 0 ? (
        <div className="mtm-market-campaign-list">
          {
            data.list.map(item => (
              <div key={item.id} className="mtm-market-campaign-item">
                <div className="campaign-info">
                  <div className={`campaign-icon campaign-icon-${item.type}`} />
                  <div className="campaign-text">
                    <div className="campaign-title" title={item.name}>{item.name}</div>
                    <div className="campaign-extra">报名时间：{item.startTimeStr} 至 {item.endTimeStr}</div>
                  </div>
                </div>
                <div className="campaign-side">
                  {status === '1' && (
                    <Button
                      onClick={() => {
                        window.open(`/marketing/activity/product-report/${item.id}?type=${item.type}`, '_blank');
                      }}
                    >立即报名</Button>
                  )}
                  {status === '2' && (
                    <Button
                      onClick={() => {
                        window.open(`/marketing/activity/product-detail/${item.id}?type=${item.type}`, '_blank');
                      }}
                    >查看详情</Button>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      ) : <Empty style={{ margin: '116px 0' }} description={`暂无${status === '1' ? '报名中' : '我报名'}的活动`}></Empty>}
    </div>
  )
};

export default Campaign;