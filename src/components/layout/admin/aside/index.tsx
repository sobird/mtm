/**
 * 侧边栏导航组件
 * 
 * sobird<i@sobird.me> at 2023/09/12 15:46:42 created.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { nanoid } from 'nanoid';
import { Button, Menu } from "antd";
import { Link, useLocation } from "react-router-dom";
import MenusService from "@/services/menus";

import { IStoreState } from "@/store/reducers";
import * as actionCreators from "@/store/actions/app";

import "./index.scss";

const { Item, SubMenu, Divider } = Menu;

/**
 * 判断路由是否作为菜单项展示，菜单项是否有子菜单
 * 如果子菜单中的项目配置menu均为false，则认为改菜单项无子菜单
 *
 * @param route
 * @returns
 */
const isMenu = (route): {
  menu: boolean;
  child?: boolean;
} => {
  if (!route.menu) {
    return {
      menu: false,
    };
  }

  if (route?.children?.length) {
    return {
      menu: true,
      child: route.children.some((child) => isMenu(child).menu),
    };
  }

  return {
    menu: true,
  };
};

/**
 * 菜单渲染 支持到三级菜单
 *
 * @param routes
 * @param dirname
 * @returns
 */
function renderMenu(routes, badge?: any) {
  const defaultOpenKeys: any[] = [];
  const menu = routes.map(route => {
    const {
      title: name, icon, children,
    } = route;

    const IS_MENU = isMenu(route);

    // if (!IS_MENU.menu) {
    //   return null;
    // }

    // route.path = path.resolve(dirname, route.path);
    const pathname = `${route.url}`;
    const pathuuid = nanoid();

    if (children && children.length) {
      defaultOpenKeys.push(route.id);

      return [
        <SubMenu
          key={route.id}
          title={(
            <>
              {icon ? <i className={`icon iconfont icon-${icon}`} /> : null}
              <span>{name}</span>
            </>
          )}
        >
          {children.length && renderMenu(children).menu}
        </SubMenu>,
        <Divider />];
    } else {
      return [
        <Item key={pathname}>
          <Link to={pathname}>
            {<i className={`icon iconfont icon-${icon}`} />}
            <span>{name}</span>
          </Link>
        </Item>,
        <Divider />,
      ];
    }
  });

  return {
    menu,
    defaultOpenKeys: [...new Set(defaultOpenKeys)],
  };
}

const Aside: React.FunctionComponent = () => {
  const location = useLocation();
  const [menus, setMenus] = useState([]);
  const [badge, setBadge] = useState({});

  const dispatch = useDispatch();
  const { collapsed } = useSelector((state: IStoreState) => state.app);

  // dispach action
  const toggleAside = useCallback(
    () => dispatch(actionCreators.toggleAside()),
    [dispatch]
  );

  useEffect(() => {
    MenusService.list().then(res => {
      setMenus(res);
    });

    MenusService.badges().then(res => {
      setBadge(res);
    })
  }, []);

  const asideMenu = renderMenu(menus, badge);
  const currentURL = location.pathname + location.search;

  console.log('collapsed', asideMenu.defaultOpenKeys)

  return (
    <aside className="app-aside">
      <div className="app-menu">
        {asideMenu.menu.length === 0 ? null : 
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[currentURL, location.pathname]}
            defaultOpenKeys={collapsed ? [] : asideMenu.defaultOpenKeys}
            // items={items}
            inlineIndent={0}
          >
            {asideMenu.menu}
          </Menu>}
      </div>

      <Button type="text" className="hamburger" onClick={toggleAside}>
        <i className="icon iconfont icon-bars" />
      </Button>
    </aside>
  )
}

export default Aside;
