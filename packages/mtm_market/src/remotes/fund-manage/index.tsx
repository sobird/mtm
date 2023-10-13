/**
 * 资金管理 卡片组件
 * 
 * @todo
 * icon 替换 优化
 * 
 * sobird<i@sobird.me> at 2023/10/14 0:41:08 created.
 */


import React from 'react';
import {message} from 'antd'
import Card from '../workbench/components/card';
// import { openNewTab } from '@util/agent';
import MyWalletSvg from './assets/my-wallet.svg';
import StatementSvg from './assets/statement.svg';
import './index.scss';

const FundManage: React.FunctionComponent = () => {
  const pathMap = {};
  const poiId = 123;
  return (
    <Card className="fund-manage-card" title="资金管理">
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
        <img src={MyWalletSvg} />
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
        <img src={StatementSvg} />
        <span>对账单</span>
      </Card.Grid>
    </Card>
  );
};

export default FundManage;
