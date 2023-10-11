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
  },
});
