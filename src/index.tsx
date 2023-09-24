import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.scss';

import { registerMicroApps, start, setDefaultMountApp } from 'qiankun';

const lifeCycles = {
  // qiankun 生命周期钩子 - 微应用加载前
  beforeLoad: (app: any) => {
    // 加载微应用前，加载进度条
    console.log('before load！', app.name);
    return Promise.resolve();
  },
  beforeMount: (app: any) => {
    // 加载微应用前，加载进度条
    console.log('before mount！', app.name);
    return Promise.resolve();
  },
  // qiankun 生命周期钩子 - 微应用挂载后
  afterMount: (app: any) => {
    // 加载微应用前，进度条加载完成
    console.log('after mount！', app.name);
    return Promise.resolve();
  },
  beforeUnmount: (app: any) => {
    // 卸载微应用前
    console.log('beforeUnmount！', app.name);
    return Promise.resolve();
  },
  afterUnmount: (app: any) => {
    // 卸载微应用完成
    console.log('afterUnmount', app.name);
    return Promise.resolve();
  },
};

const getActiveRule = (hash) => (location) => location.hash.startsWith(hash);

registerMicroApps([
  {
    name: 'mtm_market',
    entry: '//localhost:3001',
    container: '#micro-container',
    activeRule: getActiveRule('#/app-hash'),
  },
], lifeCycles);

// setDefaultMountApp(getActiveRule('#/app-hash'))

// 启动 qiankun
// start();


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

module?.hot?.accept();
