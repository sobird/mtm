/**
 * routes config
 * 
 * sobird<i@sobird.me> at 2023/09/25 17:50:44 created.
 */

import { lazy, Suspense } from "react";
import { RouteObject, Outlet } from "react-router-dom";
import { default as MTMLayout } from '@/layout';
import Loading from "@mtm/shared/components/loading";

const Coupon = lazy(() => import('@/pages/coupon'));
const CouponDetail = lazy(() => import('@/pages/coupon/detail'));

const Layout = window.__POWERED_BY_QIANKUN__ ? <Suspense fallback={<Loading />}><Outlet /></Suspense> : <MTMLayout><Outlet /></MTMLayout>
const basename = window.__POWERED_BY_QIANKUN__ ? '/market' : '/';

const routes: RouteObject[] = [
  {
    path: basename,
    element: Layout,
    children: [
      {
        path: 'coupons',
        element: <Coupon />,
      },
      {
        path: 'coupons/:id',
        element: <CouponDetail />,
      },
    ],
  },
  ,
];

export default routes;