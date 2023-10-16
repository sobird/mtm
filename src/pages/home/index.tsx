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

// 经营趋势模块
const ManageTendencyChart = React.lazy(() => import('dataApp/manage-tendency-chart'));
// 首页-顶部付款-发货
const WorkSpace = React.lazy(() => import('dataApp/work-space'));

// 实时数据
const RealTimeData = React.lazy(() => import('dataApp/real-time-data'));

// 金牌商家
const GoldMerchant = React.lazy(() => import('dataApp/gold-merchant'));

// 商家成长
const MerchantManage = React.lazy(() => import('dataApp/merchant-manage'));

const LatestNews = React.lazy(() => import('operationApp/latest-news'));
const ProductManage = React.lazy(() => import('operationApp/product-manage'));
const FundManage = React.lazy(() => import('operationApp/fund-manage'));

// 商家学习
const StudyCenter = React.lazy(() => import('operationApp/study-center'));

const MarketActivity = React.lazy(() => import('marketApp/market-activity'));

const Home: React.FC = () => {
  // const { Component: FederatedComponent, errorLoading } = useFederatedComponent('//awp-assets.meituan.net/thh/thh_feb_market/marketRemoteEntry.js', 'marketApp', './market-activity');

  return (
    <Row className='page-home' gutter={[15, 15]}>
      <Col span={24}>
        <LatestNewsCard />
      </Col>

      <Col span={24}>
        <OverviewCard className='page-home-card' style={{padding: '0px'}} />
      </Col>

      <Col span={12}>
        <RealdataCard className='page-home-card' />
      </Col>
      <Col span={12}>
        <MerchantGrowthCard className='page-home-card' />
      </Col>

      <Col span={12}>
        <ProductManageCard className='page-home-card' />
      </Col>
      <Col span={12}>
        <FundManageCard className='page-home-card' />
      </Col>

      <Col span={12}>
        <ViolationsCard className='page-home-card' />
      </Col>

      <Col span={12}>
        <MarketActivityCard className='page-home-card' />
      </Col>
      <Col span={12}>
        <GoldMerchantCard className='page-home-card' />
      </Col>

      <Col span={24}>
        <TrendingChartCard className='page-home-card' />
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
  );
};

export default Home;
