/**
 * 系统路由
 * 
 * sobird<i@sobird.me> at 2023/05/15 23:30:53 created.
 */

import React from "react";

export interface RouteProps {
  path: string; // Any valid URL path or array of paths
  search?: string; // A string representation of query parameters
  title?: string;
  icon?: string;
  hidden?: boolean;
  component?: React.ComponentType;
  children?: RouteProps[];
}