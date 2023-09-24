/** 
 * 首页路由配置
 * 
 * sobird<i@sobird.me> at 2023/09/24 22:38:48 created.
 */

import { RouteObject } from "react-router-dom";
import Home from '@/pages/home';

const HomeRoutes: RouteObject[] = [
  { 
    path: '/home', 
    element: <Home />
  },
];

export default HomeRoutes;