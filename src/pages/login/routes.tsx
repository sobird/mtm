/** 
 * 首页路由配置
 * 
 * sobird<i@sobird.me> at 2023/09/24 22:38:48 created.
 */

import { RouteObject } from "react-router-dom";
import Login from '@/pages/login';

const LoginRoutes: RouteObject[] = [
  { 
    path: '/login', 
    element: <Login />
  },
];

export default LoginRoutes;