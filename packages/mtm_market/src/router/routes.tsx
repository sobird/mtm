/**
 * routes config
 * 
 * sobird<i@sobird.me> at 2023/09/25 17:50:44 created.
 */


import { lazy } from "react";
import { RouteObject, Outlet } from "react-router-dom";
import { ProLayout } from "@ant-design/pro-components";
import Layout from "@/layout";

const CouponDetail = lazy(() => import('@/pages/coupon/detail'));

// const Layout = window.__POWERED_BY_QIANKUN__ ? null : <ProLayout layout="mix" title="ddd" appList={[{title: 'aaa'}]}><Outlet /></ProLayout>


const routes: RouteObject[] = [
  {
    path: "/market/*",
    element: window.__POWERED_BY_QIANKUN__ ? null : <Layout />,
    children: [
      {
        index: true,
        element: <CouponDetail />,
      },
      
    ],
  },

  {
    path: '*',
    element: <Layout></Layout>
  }
];

export default routes;