/**
 * 侧边栏导航组件
 * 
 * sobird<i@sobird.me> at 2023/09/12 15:46:42 created.
 */
import path from 'path';
import { nanoid } from 'nanoid';
import React, { useEffect, useState } from "react";
import { Button, Menu } from "antd";
import { AppstoreOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import MenusService from "@/services/menus";

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
function renderMenu(routes) {
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
              {typeof icon === 'string' ? <i className={`icon iconfont icon-${icon}`} /> : icon}
              <span>{name}</span>
            </>
          )}
        >
          {children.length && renderMenu(children).menu}
        </SubMenu>,
        <Divider />];
    } else {
      return [
        <Menu.Item key={pathname}>
          <Link to={pathname}>
            {typeof icon === 'string' ? <i className={`icon iconfont icon-${icon}`} /> : icon}
            <span>{name}</span>
          </Link>
        </Menu.Item>,
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

  const [items, setItems] = useState([]);
  useEffect(() => {
    MenusService.list().then(res => {
      setItems(res.menus);
    })
  }, []);

  const asideMenu = renderMenu(items);

  console.log('asideMenu', asideMenu)

  return (
    <aside className="app-aside">
      <div className="app-menu">
        {asideMenu.menu.length === 0 ? null : 
          <Menu
            mode="inline"
            //inlineCollapsed={collapsed}
            defaultSelectedKeys={[location.pathname]}
            defaultOpenKeys={asideMenu.defaultOpenKeys}
            // items={items}
            inlineIndent={7}
          >
            {asideMenu.menu}
          </Menu>}
      </div>
    </aside>
  )
}

export default Aside;
