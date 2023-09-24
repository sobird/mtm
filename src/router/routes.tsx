/**
 * routes config
 * 
 * sobird<i@sobird.me> at 2023/09/21 3:15:30 created.
 */

import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import LayoutAdmin from '@/components/layout/admin';
import NoneSupport from "@/pages/none-support";

import HomeRoutes from "@/pages/home/routes";
import LoginRoutes from "@/pages/login/routes";

const Login = lazy(() => import('@/pages/login'));
const Register = lazy(() => import('@/pages/register'));
const RegisterSuccess = lazy(() => import('@/pages/register/success'));
const SettleInpc = lazy(() => import('@/pages/settleinpc'));
const EntryHome = lazy(() => import('@/pages/settleinjx/home'));
const EntryShop = lazy(() => import('@/pages/settleinjx/shop'));
const EntryCompany = lazy(() => import('@/pages/settleinjx/company'));

const routes: RouteObject[] = [
  {
    path: "/",
    element: <LayoutAdmin />,
    children: [
      ...HomeRoutes,
    ],
  },
  // {
  //   path: "/app-hash",
  //   element: <LayoutAdmin />,
  //   children: [
      
  //   ],
  // },
  ...LoginRoutes,
  { path: '/register', element:<Register /> },
  { path: '/register/success', element:<RegisterSuccess /> },
  { path: '/settleinpc', element:<SettleInpc /> },
  { path: '/settleinjx/home', element:<EntryHome /> },
  { path: '/settleinjx/shop', element:<EntryShop /> },
  { path: '/settleinjx/company', element:<EntryCompany /> },
  {
    path: "*",
    element: <NoneSupport />,
  },
];

export default routes;
