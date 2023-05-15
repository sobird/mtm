/**
 * Entry
 *
 * sobird<i@sobird.me> at 2021/07/02 15:40:08 created.
 */

import React from 'react';
import {
  BrowserRouter,
} from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';

import { Provider } from 'react-redux';
import store from './store';

ConfigProvider.config({
  prefixCls: 'mtm',
});

interface EntryProps {
  children: React.ReactNode
}

function Entry(props: EntryProps) {
  return (
    <ConfigProvider locale={zhCN}>
      <Provider store={store}>
        <BrowserRouter>
          {props.children}
        </BrowserRouter>
      </Provider>
    </ConfigProvider>
  );
}

export default Entry;
