/**
 * routes config
 *
 * sobird<i@sobird.me> at 2023/09/21 3:15:30 created.
 */

import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import theme from '@/styles/theme';

import LayoutAdmin from '@/layout/admin';
import { NoneSupport } from '@mtm/shared';
import Login from '@/pages/login';
import Register from '@/pages/register';
import RegisterSuccess from '@/pages/register/success';

// const Home = lazy(() => import('@/pages/home'));
import Home from '@/pages/home';
import Setting from '@/pages/setting';
import SettingProfile from '@/pages/setting/profile';
import MdxTest from '@/pages/mdx';

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
        path: 'setting',
        element: <Setting />,
        children: [
          {
            index: true,
            element: <SettingProfile />,
          },
        ],
      },
      {
        path: 'mdx',
        element: <MdxTest />,
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
  {
    path: '/login',
    element: (
      <ConfigProvider componentSize='large' theme={theme}>
        <Login />
      </ConfigProvider>
    ),
  },
  {
    path: '/register',
    element: (
      <ConfigProvider componentSize='large' theme={theme}>
        <Register />
      </ConfigProvider>
    ),
  },
  { path: '/register/success', element: <RegisterSuccess /> },
  { path: '/settleinpc', element: <SettleInpc /> },
  { path: '/settleinjx/home', element: <EntryHome /> },
  { path: '/settleinjx/shop', element: <EntryShop /> },
  { path: '/settleinjx/company', element: <EntryCompany /> },
];

export default routes;
