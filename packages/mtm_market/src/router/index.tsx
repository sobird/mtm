/**
 * 路由初始化
 * 
 * sobird<i@sobird.me> at 2023/09/25 17:50:13 created.
 */

import { createHashRouter } from 'react-router-dom';
import routes from './routes';

export default createHashRouter(routes, {
  basename: window.__POWERED_BY_QIANKUN__ ? '/market' : '/'
});
