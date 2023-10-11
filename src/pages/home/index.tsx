/**
 * 首页
 * 
 * sobird<i@sobird.me> at 2023/09/13 17:24:00 created.
 */

import React, { Suspense } from "react";
import useFederatedComponent from '@/hooks/useFederatedComponent';

const MarketCampaign = React.lazy(() => import("market/Campaign"));
// 经营趋势模块
const ManageTendencyChart = React.lazy(() => import("dataApp/manage-tendency-chart"));
// 首页-顶部付款-发货
const WorkSpace = React.lazy(() => import("dataApp/work-space"));

// 实时数据
const RealTimeData = React.lazy(() => import("dataApp/real-time-data"));

// 金牌商家
const GoldMerchant = React.lazy(() => import("dataApp/gold-merchant"));

// 商家成长
const MerchantManage = React.lazy(() => import("dataApp/merchant-manage"));

const LatestNews = React.lazy(() => import("operationApp/latest-news"));
const ProductManage = React.lazy(() => import("operationApp/product-manage"));
const FundManage = React.lazy(() => import("operationApp/fund-manage"));

// 商家学习
const StudyCenter = React.lazy(() => import("operationApp/study-center"));

const MarketActivity = React.lazy(() => import("marketApp/market-activity"));

const Home: React.FC = () => {
  // const { Component: FederatedComponent, errorLoading } = useFederatedComponent('//awp-assets.meituan.net/thh/thh_feb_market/marketRemoteEntry.js', 'marketApp', './market-activity');
  
  return (
    <div>home
      <Suspense fallback="loading">
        <h3>营销活动模块</h3>
        <MarketCampaign />
        <h3>营销活动-美团</h3>
        <MarketActivity />
        <h3>经营趋势模块</h3>
        <ManageTendencyChart />
        <h3>顶部付款-发货</h3>
        <WorkSpace />
        <h3>实时数据</h3>
        <RealTimeData />
        {/* <h3>金牌商家</h3>
        <GoldMerchant getGoldData={() => {}} /> */}
        {/* <h3>商家成长</h3>
        <MerchantManage /> */}
        <h3>违规情况</h3>
        <ProductManage />
        <h3>资金管理模块</h3>
        <FundManage />
        {/* <h3>商家学习</h3>
        <StudyCenter /> */}
      </Suspense>
    </div>
  )
}

export default Home;
