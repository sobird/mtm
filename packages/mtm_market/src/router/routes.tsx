/**
 * routes config
 * 
 * sobird<i@sobird.me> at 2023/09/25 17:50:44 created.
 */


import { lazy } from "react";
import { RouteObject, Outlet } from "react-router-dom";
import Layout from "@/layout";

const Coupon = lazy(() => import('@/pages/coupon'));
const CouponDetail = lazy(() => import('@/pages/coupon/detail'));

const MTMLayout = window.__POWERED_BY_QIANKUN__ ? null : <Layout><Outlet /></Layout>
const basename = window.__POWERED_BY_QIANKUN__ ? '/market' : '/';

const routes: RouteObject[] = [
  {
    path: basename,
    element: MTMLayout,
    children: [
      {
        path: 'coupons',
        index: true,
        element: <Coupon />,
      },
      
    ],
  }
];

export default routes;