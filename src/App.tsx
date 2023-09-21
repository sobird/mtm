/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Suspense } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';

import './App.css';

import '@mtm/shared/provider';

const theme = { token: { colorPrimary: '#ffd100', borderRadius: 2, colorWhite: '#333' } };

ConfigProvider.config({
  prefixCls: 'mtm',
  theme,
})

import config from '@/routes/config';
const router = createHashRouter(config);

function App() {
  return (
    <ConfigProvider componentSize='large' locale={zhCN} prefixCls='mtm' theme={theme}>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
