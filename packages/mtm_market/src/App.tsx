import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import router from '@/router';
import './App.scss';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN} prefixCls='mtm'>
    <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
