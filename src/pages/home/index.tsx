/**
 * 后台首页
 *
 * sobird<i@sobird.me> at 2023/09/13 17:24:00 created.
 */

import React, { Suspense } from 'react';
import { Row, Col } from 'antd';
import useFederatedComponent from '@/hooks/useFederatedComponent';

import './index.scss';

const LatestNewsCard = React.lazy(() => import('market/latest-news'));
const MarketActivityCard = React.lazy(() => import('market/market-activity'));
const FundManageCard = React.lazy(() => import('market/fund-manage'));
const OverviewCard = React.lazy(() => import('market/overview'));
const RealdataCard = React.lazy(() => import('market/realdata'));
const MerchantGrowthCard = React.lazy(() => import('market/merchant-growth'));
const ProductManageCard = React.lazy(() => import('market/product-manage'));
const TrendingChartCard = React.lazy(() => import('market/trending-chart'));
const ViolationsCard = React.lazy(() => import('market/violations'));
const GoldMerchantCard = React.lazy(() => import('market/gold-merchant'));

const Home: React.FC = () => {
  // const { Component: FederatedComponent, errorLoading } = useFederatedComponent('//awp-assets.meituan.net/thh/thh_feb_market/marketRemoteEntry.js', 'marketApp', './market-activity');

  return (
    <div className='page-home'>
      <Row gutter={[15, 15]}>
        <Col span={24}>
          <LatestNewsCard style={{paddingBottom: 0}}/>
        </Col>

        <Col span={24}>
          <OverviewCard className='page-home-card' style={{padding: '0px'}} />
        </Col>

        <Col span={12}>
          <RealdataCard bodyStyle={{height: 198}} />
        </Col>
        <Col span={12}>
          <MerchantGrowthCard bodyStyle={{height: 198}}/>
        </Col>

        <Col span={12}>
          <ProductManageCard />
        </Col>
        <Col span={12}>
          <FundManageCard />
        </Col>

      

      
        <Col span={12}>
          <GoldMerchantCard bodyStyle={{height: 465}}/>
        </Col>

        <Col span={12}>
          <Row gutter={[0, 15]}>
            <Col span={24}>
              <MarketActivityCard max={4} bodyStyle={{paddingTop: 6}} />
            </Col>
            <Col span={24}><ViolationsCard bodyStyle={{paddingTop: 16}}/></Col>
          </Row>
        </Col>

        <Col span={24}>
          <TrendingChartCard />
        </Col>

        {/* <Suspense fallback="loading">
        <FundManageCard />
        <h3>营销活动模块</h3>
        <MarketActivityCard />
        <h3>营销活动-美团</h3>
        <MarketActivity />
        <h3>经营趋势模块</h3>
        <ManageTendencyChart />
        <h3>顶部付款-发货</h3>
        <WorkSpace />
        <h3>实时数据</h3>
        <RealTimeData />
        <h3>金牌商家</h3>
        <GoldMerchant getGoldData={() => {}} />
        <h3>商家成长</h3>
        <MerchantManage />
        <h3>违规情况</h3>
        <ProductManage />
        <h3>资金管理模块</h3>
        <FundManage />
        <h3>商家学习</h3>
        <StudyCenter />
      </Suspense> */}
      </Row>
    </div>
  );
};

export default Home;
