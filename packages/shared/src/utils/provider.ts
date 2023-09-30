/**
 * MTM微前端通用包
 *
 * sobird<i@sobird.me> at 2023/09/13 21:31:48 created.
 */

import * as React from 'react';
import * as ReactRouterDOM from 'react-router-dom';

(function (root: any, deps: any) {
  Object.keys(deps).forEach(key => {
    root[key] = deps[key];
  });
})(window, {
  mtm: {
    React,
    ReactRouterDOM,
  },
});
