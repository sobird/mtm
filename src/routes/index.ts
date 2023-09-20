/**
 * 系统路由
 * 
 * sobird<i@sobird.me> at 2023/05/15 23:30:53 created.
 */

import React from "react";
import { Path, RouterProps }  from 'react-router-dom'
import Home from "@/pages/home";

export interface RouteModel {
  path: string;
  search?: string;
  title?: string;
  icon?: string;
  hidden?: boolean;
  component?: React.ComponentType;
  children?: RouteModel[];
}

export const routes: RouteModel[] = [
  {
    title: '首页',
    path: `/`,
    component: Home,
  },
  {
    title: '关于',
    path: `/about`,
  },
];
