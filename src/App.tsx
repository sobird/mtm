import { useState } from 'react';
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

function App() {
  return (
    <ConfigProvider componentSize='large' locale={zhCN} prefixCls='mtm' theme={theme}>
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
