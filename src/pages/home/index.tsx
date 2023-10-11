/**
 * 首页
 * 
 * sobird<i@sobird.me> at 2023/09/13 17:24:00 created.
 */

import React, { Suspense } from "react";
import useFederatedComponent from '@/hooks/useFederatedComponent';

const ChildApp = React.lazy(() => import("market/Campaign"));
const ChildApp2 = React.lazy(() => import("market/latest-news"));
import FederatedAdapter from '@/components/federated-adapter';

const Home: React.FC = () => {
  const { Component: FederatedComponent, errorLoading } = useFederatedComponent('//awp-assets.meituan.net/thh/thh_feb_merchant_operation/operationRemoteEntry.js', 'operationApp', './latest-news');
  console.log('Component', FederatedComponent, ChildApp, ChildApp2)
  return (
    <div>home
      <Suspense fallback="loading">
        <ChildApp2 />
      </Suspense>
    </div>
  )
}

export default Home;
