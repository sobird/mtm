/**
 * 资金管理 卡片组件
 * 
 * @todo
 * 路由跳转拦截权限判断
 * 
 * sobird<i@sobird.me> at 2023/10/14 0:41:08 created.
 */

import React, { ComponentProps } from 'react';
import {message} from 'antd'
import Card from '../workbench/components/card';
// import { openNewTab } from '@util/agent';
import './index.scss';

const FundManage: React.FC<ComponentProps<typeof Card>> = (props) => {
  const pathMap = {};
  const poiId = 123;
  return (
    <Card classCard="fund-manage-card" title="资金管理" {...props}>
      <Card.Grid
        className="item"
        onClick={() => {
          // mc('b_group_mall_b_zpcv027t_mc', {
          //   poi_id: poiId,
          //   btn_index: 0,
          //   btn_name: '我的钱包',
          // });
          if (!pathMap['/account/wallet']) {
            message.error('当前跳转页面无权限，请联系主账户进行开通');
            return;
          }
          // openNewTab('/account/wallet');
        }}
      >
        <i className='icon iconfont icon-wallet'></i>
        <span>我的钱包</span>
      </Card.Grid>
      <Card.Grid
        className="item"
        onClick={() => {
          // mc('b_group_mall_b_zpcv027t_mc', {
          //   poi_id: poiId,
          //   btn_index: 1,
          //   btn_name: '对账单',
          // });
          if (!pathMap['/account/statement']) {
            message.error('当前跳转页面无权限，请联系主账户进行开通');
            return;
          }
          // openNewTab('/account/statement');
        }}
      >
        <i className='icon iconfont icon-bill'></i>
        <span>对账单</span>
      </Card.Grid>
    </Card>
  );
};

export default FundManage;
