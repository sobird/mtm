/**
 * 侧边栏导航组件
 *
 * sobird<i@sobird.me> at 2023/09/12 15:46:42 created.
 */

import React, { useEffect, useState } from 'react';

import { nanoid } from 'nanoid';
import { Button, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import MenuService, { Favorites } from '@/services/menu';

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleAside } from '@/store/actions/app';
import { fetchMenuThunkAction } from '@/store/actions/menu';

import TitleWithBadge from './components/title-with-badge';

import './index.scss';

const { Item, SubMenu, Divider } = Menu;

/**
 * 判断路由是否作为菜单项展示，菜单项是否有子菜单
 * 如果子菜单中的项目配置menu均为false，则认为改菜单项无子菜单
 *
 * @param route
 * @returns
 */
const isMenu = (
  route
): {
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
      child: route.children.some(child => isMenu(child).menu),
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
function renderMenu(routes, badgeMap) {
  const defaultOpenKeys: any[] = [];
  const menu = routes.map(route => {
    const { title: name, icon, children } = route;

    const IS_MENU = isMenu(route);

    // if (!IS_MENU.menu) {
    //   return null;
    // }

    // route.path = path.resolve(dirname, route.path);
    const pathname = `${route.url}`;
    const pathuuid = nanoid();

    if (children && children.length) {
      defaultOpenKeys.push(route.id);

      const isFavorites = route.code === Favorites.code;

      return [
        <SubMenu
          className={isFavorites && 'fav-submenu'}
          key={route.id}
          title={
            <>
              <span className='submenu-title'>
                {icon ? <i className={`icon iconfont icon-${icon}`} /> : null}
                <span className='submenu-title-text'>{name}</span>
                <span className='fav-submenu-count'>已添加3/10</span>
              </span>

              {isFavorites && <span className='fav-submenu-setting' onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                
              }}>管理</span>}
            </>
          }
          // icon={<i className={`icon iconfont icon-${icon}`} />}
        >
          {children.length && renderMenu(children, badgeMap).menu}
        </SubMenu>,
        <Divider />,
      ];
    } else {
      const badge = badgeMap && badgeMap.get && badgeMap.get(route.id);

      return [
        <Item key={pathname}>
          <Link to={pathname}>
            {<i className={`icon iconfont icon-${icon}`} />}
            <TitleWithBadge badge={badge}>
              <span>{name}</span>
            </TitleWithBadge>
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
  const [badgeMap, setBadgeMap] = useState({});
  const dispatch = useAppDispatch();

  const { collapsed } = useAppSelector(state => state.app);
  const { menuTrees } = useAppSelector(state => state.menu);

  useEffect(() => {
    dispatch(fetchMenuThunkAction);

    MenuService.badges().then(res => {
      setBadgeMap(res);
    });
  }, [dispatch]);

  const asideMenu = renderMenu(menuTrees, badgeMap);
  const currentURL = location.pathname + location.search;

  return (
    <aside className='app-aside'>
      <div className='app-menu'>
        {asideMenu.menu.length === 0 ? null : (
          <Menu
            mode='inline'
            inlineCollapsed={collapsed}
            selectedKeys={[currentURL, location.pathname]}
            defaultOpenKeys={collapsed ? [] : asideMenu.defaultOpenKeys}
            // items={items}
            inlineIndent={0}
          >
            {asideMenu.menu}
          </Menu>
        )}
      </div>

      <Button type='text' className='hamburger' onClick={() => dispatch(toggleAside())}>
        <i className='icon iconfont icon-bars' />
      </Button>
    </aside>
  );
};

export default Aside;
