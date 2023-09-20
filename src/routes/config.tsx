/**
 * routes config
 * 
 * sobird<i@sobird.me> at 2023/09/21 3:15:30 created.
 */

import { lazy, Suspense } from "react";
import { Outlet, RouteObject, RouteProps } from "react-router-dom";

import LayoutMain from '@/components/layout/main';
const Login = lazy(() => import('@/pages/login'));
const Register = lazy(() => import('@/pages/register'));
const RegisterSuccess = lazy(() => import('@/pages/register/success'));
const SettleInpc = lazy(() => import('@/pages/settleinpc'));
const EntryHome = lazy(() => import('@/pages/settleinjx/home'));
const EntryShop = lazy(() => import('@/pages/settleinjx/shop'));
const EntryCompany = lazy(() => import('@/pages/settleinjx/company'));

const config: RouteObject[] = [
  {
    path: "/",
    element: <LayoutMain><Outlet /></LayoutMain>,
    //  errorElement: "errorElement",
    children: [
      {
        path: "test",
        element: <div>Child</div>,
      },

      {
        path: "*",
        element: <div>404</div>,
      },
    ],
  },
  { path: '/login', element:<Login /> },
  { path: '/register', element:<Register /> },
  { path: '/register/success', element:<RegisterSuccess /> },
  { path: '/settleinpc', element:<SettleInpc /> },
  { path: '/settleinjx/home', element:<EntryHome /> },
  { path: '/settleinjx/shop', element:<EntryShop /> },
  { path: '/settleinjx/company', element:<EntryCompany /> },
];

export default config;
