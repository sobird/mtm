/**
 * routes config
 * 
 * sobird<i@sobird.me> at 2023/09/21 3:15:30 created.
 */

import { lazy, Suspense } from "react";
import { Outlet, RouteObject, useRouteError } from "react-router-dom";
import LayoutAdmin from '@/components/layout/admin';
import ErrorBoundary from "@/components/error-boundary";

const Login = lazy(() => import('@/pages/login'));
const Register = lazy(() => import('@/pages/register'));
const RegisterSuccess = lazy(() => import('@/pages/register/success'));
const SettleInpc = lazy(() => import('@/pages/settleinpc'));
const EntryHome = lazy(() => import('@/pages/settleinjx/home'));
const EntryShop = lazy(() => import('@/pages/settleinjx/shop'));
const EntryCompany = lazy(() => import('@/pages/settleinjx/company'));



function ErrorBoundary1() {
  const error = useRouteError();
  dd
  return (
    <div>ddd</div>
  )
}



const config: RouteObject[] = [
  {
    path: "/",
    element: <LayoutAdmin><ErrorBoundary><Outlet /></ErrorBoundary></LayoutAdmin>,
    children: [
      {
        path: "test",
        element: <ErrorBoundary1 />,
      },

      {
        path: "*",
        element: <div>404</div>,
      },
    ],
  },
  { path: '/login', element: <ErrorBoundary><Login /> </ErrorBoundary>},
  { path: '/register', element:<Register /> },
  { path: '/register/success', element:<RegisterSuccess /> },
  { path: '/settleinpc', element:<SettleInpc /> },
  { path: '/settleinjx/home', element:<EntryHome /> },
  { path: '/settleinjx/shop', element:<EntryShop /> },
  { path: '/settleinjx/company', element:<EntryCompany /> },
];

export default config;
