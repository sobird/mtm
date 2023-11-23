/**
 * MTM微前端通用包
 *
 * @todo
 * 迁移到@mtm/shared
 *
 * sobird<i@sobird.me> at 2023/09/13 21:31:48 created.
 */

import * as React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import * as Antd from 'antd';
import * as AntdProComponents from '@ant-design/pro-components';
import * as AntdIcons from '@ant-design/icons';
import IntersectionObserveWrapper from '@/hooks/useIntersectionObserver';
import http from './utils/http';

(function (root: any, deps: any) {
  Object.keys(deps).forEach(key => {
    root[key] = deps[key];
  });
}(window, {
  mtm: {
    React,
    ReactRouterDOM,
    Antd,
    AntdProComponents,
    AntdIcons,
  },
  // todo
  tfe: {
    React,
    ReactRouterDOM,
    Antd,
    AntdProComponents,
    AntdIcons,
    components: {
      IntersectionObserveWrapper,
      Message: Antd.message,
      ErrorBoundary: {},
      SliderLogin: {},
      AuthWrapper: {},
      RoutersRender: {},
      RemoteComponentWrap: {},
      CommonLoading: {},
    },
    env: {
      MAIN_STATIC_URL: '//awp-assets.meituan.net/thh/thh_feb_merchant_main/',
    },
    constants: {

    },
  },
  $thh: {
    Request: http,
    getStore(key) {
      console.log('key $thh', key);
      return {
        poiId: 148568,
        name: '小米妈妈家居旗舰店',
      };
    },
  },
  baseSDK: {
    Request: http,
    getStore(key) {
      console.log('key', key);
      return {
        poiId: 148568,
        name: '小米妈妈家居旗舰店',
      };
    },
  },
}));
