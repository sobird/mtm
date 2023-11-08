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
import Component from '@/pages/component';

const SettleInpc = lazy(() => import('@/pages/settleinpc'));
const EntryHome = lazy(() => import('@/pages/settleinjx/home'));
const EntryShop = lazy(() => import('@/pages/settleinjx/shop'));
const EntryCompany = lazy(() => import('@/pages/settleinjx/company'));

import ShopProfile from '@/pages/shop/profile';
import ShopProfileWallet from '@/pages/shop/profile/wallet';
const ShopAdmin = lazy(() => import('@/pages/shop/admin'));
const ShopProfileBase = lazy(() => import('@/pages/shop/profile/base-info'));
const ShopProfilePrincipal = lazy(() => import('@/pages/shop/profile/principal'));
const ShopProfileSettlement = lazy(() => import('@/pages/shop/profile/settlement'));
const ShopProfileLicense = lazy(() => import('@/pages/shop/profile/license'));
import TrademarkPage from '@/pages/shop/trademark';

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
        path: 'component',
        element: <Component />,
      },

      {
        path: 'shop',
        children: [
          {
            path: 'admin',
            element: <ShopAdmin />
          },
        ]
      },

      {
        path: "shop/trademark",
        element: <TrademarkPage />
      },

      {
        path: 'shop/profile',
        element: <ShopProfile />,
        children: [{
          index: true,
          element: <ShopProfileBase />
        },

        {
          path: "principal",
          element: <ShopProfilePrincipal />
        },

        {
          path: "license",
          element: <ShopProfileLicense />
        },

        {
          path: "wallet",
          element: <ShopProfileWallet />
        },

        {
          path: "settlement",
          element: <ShopProfileSettlement />
        },
        
        {
          path: '*',
          element: <NoneSupport />,
        }]
      },


      // 404
      {
        path: '*',
        element: <NoneSupport />,
      }
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
