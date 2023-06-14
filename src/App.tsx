import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import Login from './pages/login';
import Register from './pages/register';
import './App.css';

const theme = { token: { colorPrimary: '#ffd100', borderRadius: 2, colorWhite: '#333' } };

function App() {
  return (
    <ConfigProvider componentSize='large' locale={zhCN} prefixCls='mtm' theme={theme}>
      <HashRouter>
        <Routes>
          <Route path='/login' element={<Login />}></Route>
          <Route path='/register' element={<Register />}></Route>
        </Routes>
      </HashRouter>
    </ConfigProvider>
  );
}

export default App;
