/**
 * MTM微前端通用包
 *
 * sobird<i@sobird.me> at 2023/09/13 21:31:48 created.
 */

import * as React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import * as Antd from 'antd';
import * as AntdProComponents from '@ant-design/pro-components';
import * as AntdIcons from '@ant-design/icons';
import IntersectionObserveWrapper from '@/hooks/useIntersectionObserver';
import metrics from '@/utils/metrics';
import http from './utils/http';
import * as report from '@/utils/report/wrapper';

export enum MicroAPPSType {
  THH_FEB_MERCHANT_MAIN = 'thh_feb_merchant_main',
  THH_FEB_MERCHANT_OPERATION = 'thh_feb_merchant_operation',
  THH_FEB_MERCHANT_ORDER = 'thh_feb_merchant_order',
  THH_FEB_DATA = 'thh_feb_data',
  THH_FEB_MARKET = 'thh_feb_market',
  THH_FEB_PRODUCT = 'thh_feb_product',
  FE_MERCHANT_ADMIN = 'fe-merchant-admin',
}

(function (root: any, deps: any) {
  Object.keys(deps).forEach(key => {
    root[key] = deps[key];
  });
})(window, {
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
      MAIN_STATIC_URL: '//awp-assets.meituan.net/thh/thh_feb_merchant_main/'
    },
    constants: {
      MicroAPPSType,
    },
  },
  $thh: {
    metrics,
    report,
    Request: http,
    getStore: function(key) {
      console.log('key $thh', key);
      return {
        name: '商家名称',
        defaultAddressList: {}
      }
    }
  },
  baseSDK: {
    metrics,
    report,
    Request: http,
    getStore: function(key) {
      console.log('key', key);
      return {}
    }
  },
});
