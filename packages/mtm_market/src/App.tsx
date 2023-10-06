import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import router from '@/router';
import { MasterContext } from '@/utils/context';
import './App.scss';

interface AppProps {
  master: any;
}

const App: React.FC<AppProps> = ({ master = {} }) => {
  return (
    <ConfigProvider locale={zhCN} prefixCls='mtm'>
      <MasterContext.Provider value={ master }>
        <RouterProvider router={router} />
      </MasterContext.Provider>
    </ConfigProvider>
  );
};

export default App;
