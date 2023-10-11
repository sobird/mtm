/**
 * routes config
 *
 * sobird<i@sobird.me> at 2023/09/21 3:15:30 created.
 */

import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

import LayoutAdmin from '@/layout/admin';
import NoneSupport from '@/pages/none-support';
import Login from '@/pages/login';
import Register from '@/pages/register';
import RegisterSuccess from '@/pages/register/success';

// const Home = lazy(() => import('@/pages/home'));
import Home from '@/pages/home';
const SettleInpc = lazy(() => import('@/pages/settleinpc'));
const EntryHome = lazy(() => import('@/pages/settleinjx/home'));
const EntryShop = lazy(() => import('@/pages/settleinjx/shop'));
const EntryCompany = lazy(() => import('@/pages/settleinjx/company'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <LayoutAdmin />,
    children: [
      {
        index: true,
        // path: 'home',
        element: <Home />,
      },
      {
        path: '*',
        element: <NoneSupport />,
      },
    ],
  },
  {
    path: '/market/*',
    element: <LayoutAdmin />,
  },
  // {
  //   path: "/app-hash",
  //   element: <LayoutAdmin />,
  //   children: [

  //   ],
  // },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/register/success', element: <RegisterSuccess /> },
  { path: '/settleinpc', element: <SettleInpc /> },
  { path: '/settleinjx/home', element: <EntryHome /> },
  { path: '/settleinjx/shop', element: <EntryShop /> },
  { path: '/settleinjx/company', element: <EntryCompany /> },
];

export default routes;
