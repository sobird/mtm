/**
 * 注册页路由配置
 * 
 * sobird<i@sobird.me> at 2023/09/24 23:52:47 created.
 */



import { RouteObject } from "react-router-dom";
import { route as RegisterRoute } from '@/pages/register';
import { route as RegisterSuccessRoute } from "@/pages/register/success";

const routes: RouteObject[] = [
  RegisterRoute,
  RegisterSuccessRoute
];

export default routes;
