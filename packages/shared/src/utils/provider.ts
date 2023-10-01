/**
 * MTM微前端通用包
 *
 * sobird<i@sobird.me> at 2023/09/13 21:31:48 created.
 */

import * as React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import * as Antd from 'antd';
import * as ProComponents from '@ant-design/pro-components'

(function (root: any, deps: any) {
  Object.keys(deps).forEach(key => {
    root[key] = deps[key];
  });
})(window, {
  mtm: {
    React,
    ReactRouterDOM,
    Antd,
    ProComponents,
  },
});
