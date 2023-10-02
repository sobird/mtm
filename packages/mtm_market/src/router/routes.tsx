/**
 * routes config
 *
 * sobird<i@sobird.me> at 2023/09/25 17:50:44 created.
 */

import { lazy, Suspense } from 'react';
import { RouteObject, Outlet } from 'react-router-dom';
import { default as MTMLayout } from '@/layout';
import Loading from '@/components/loading';
import NoneSupport from "@mtm/shared/components/none-support";

const Coupon = lazy(() => import('@/pages/coupon'));
const CouponDetail = lazy(() => import('@/pages/coupon/detail'));

const suspense = (
  <Suspense fallback={<Loading />}>
    <Outlet />
  </Suspense>
);
const Layout = window.__POWERED_BY_QIANKUN__ ? suspense : <MTMLayout>{suspense}</MTMLayout>;

const routes: RouteObject[] = [
  {
    path: '/*',
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

      {
        path: "*",
        element: <NoneSupport />,
      },
    ],
  },
  ,
];

export default routes;
