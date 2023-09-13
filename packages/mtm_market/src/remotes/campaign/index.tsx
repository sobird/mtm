/**
 * 营销活动 模块联邦组件
 * 
 * sobird<i@sobird.me> at 2023/09/14 1:53:11 created.
 */

import React from "react";
import { Tabs } from 'antd';

import './index.scss';

const Campaign: React.FC = () => {
  return (
    <div className="mtm-market-campaign">
      <div className="mtm-market-campaign-tabs">
        <Tabs
          defaultActiveKey="1"
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
    </div>
  )
};

export default Campaign;