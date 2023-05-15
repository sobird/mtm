/**
 * 路由导航守卫
 *
 * sobird<i@sobird.me> at 2021/07/15 11:30:49 created.
 */

import React from "react";
import { Redirect, Route } from "react-router-dom";
import { Location } from 'history';
import { RouteProps } from '@/router';


interface GuardsProps {
  routes: RouteProps[];
  location: Location
}

class Guards extends React.Component<GuardsProps> {
  shouldComponentUpdate(nextProps: Readonly<GuardsProps>): boolean {
    const {
      location: { 
        pathname: nextPathname,
      },
    } = nextProps;

    const {
      location: { 
        pathname 
      },
      routes,
    } = this.props;

    // 判断跳转路由不等于当前路由
    if (nextPathname !== pathname || routes.length === 0) {
      return true;
    }
    
    return false;
  }

  /**
   * 判断一个路径是否是另一个路径的子路径
   *
   * @param pathConfig 配置文件中的路径的全路径
   * @param pathTarget 用户请求的路径
   */
  static switchRoute(pathConfig: string, pathTarget: string) {
    if (pathConfig === pathTarget) return true;

    const reg = new RegExp(`(^${pathConfig})(?=/)`);
    return reg.test(pathTarget);
  }

  render() {
    const { location, routes } = this.props;
    const { pathname } = location;

    const targetRouterConfig = routes.find((item: any) => {
      const { path } = item;
      if (path.includes(':')) {
        const reg = new RegExp(`^${item.path.replace(/(:\w+)/g, '(.+)')}$`);
        return reg.test(pathname);
      }

      return Guards.switchRoute(item.path.replace(/\s*/g, ''), pathname);
    });

    if (targetRouterConfig) {
      return <Route exact path={targetRouterConfig.path} component={targetRouterConfig.component} />;
    }

    return <Redirect to="/" />;
  }
}

export default Guards;
