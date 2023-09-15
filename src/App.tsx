/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import Login from './pages/login';
import Register from './pages/register';
import RegisterSuccess from './pages/register/success';
import SettleInpc from './pages/settleinpc';
import EntryHome from './pages/settleinjx/home';
import EntryShop from './pages/settleinjx/shop';
import EntryCompany from './pages/settleinjx/company';

import LayoutMain from './components/layout/main';
import './App.css';

import '@mtm/shared/provider';

const theme = { token: { colorPrimary: '#ffd100', borderRadius: 2, colorWhite: '#333' } };

ConfigProvider.config({
  prefixCls: 'mtm',
  theme,
})

import useFederatedComponent from './hooks/useFederatedComponent';
// @ts-ignore
const ChildApp = React.lazy(() => import("market/Campaign"));

import Adapter from './Adapter';

// console.log('ChildApp', ChildApp)

function App() {
  const { Component: FederatedComponent, errorLoading } = useFederatedComponent('http://localhost:3001/remoteEntry.js', 'market', './Campaign');
  return (
    <ConfigProvider componentSize='large' locale={zhCN} prefixCls='mtm' theme={theme}>
      {/* {errorLoading
        ? `Error loading module "${module}"`
        : FederatedComponent && <FederatedComponent />} */}

      <Adapter importer={() => ChildApp} />
      <HashRouter>
        <Routes>
          <Route path='/login' element={<Login />}></Route>
          <Route path='/register' element={<Register />}></Route>
          <Route path='/register/success' element={<RegisterSuccess />}></Route>
          <Route path='/settleinpc' element={<SettleInpc />}></Route>
          <Route path='/settleinjx/home' element={<EntryHome />}></Route>
          <Route path='/settleinjx/shop' element={<EntryShop />}></Route>
          <Route path='/settleinjx/company' element={<EntryCompany />}></Route>

          <Route path='/*' element={<LayoutMain />}></Route>
        </Routes>
      </HashRouter>
    </ConfigProvider>
  );
}

export default App;
