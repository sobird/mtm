/**
 * 侧边栏导航组件
 *
 * sobird<i@sobird.me> at 2023/09/12 15:46:42 created.
 */

import React, { useEffect, useState } from 'react';
import {message} from 'antd';
import classNames from 'classnames';

import { PlusCircleOutlined, MinusCircleOutlined, PlusCircleFilled, MinusCircleFilled } from '@ant-design/icons';

import { nanoid } from 'nanoid';
import { Button, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import MenuService, { Favorites } from '@/services/menu';

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleAside } from '@/store/actions/app';
import { fetchMenuThunkAction, insertFavMenuItem, removeFavMenuItem } from '@/store/actions/menu';
import TitleWithBadge from './components/title-with-badge';

import './index.scss';

const { Item, SubMenu, Divider } = Menu;

const Aside: React.FunctionComponent = () => {
  const location = useLocation();
  const [badgeMap, setBadgeMap] = useState(new Map());
  const dispatch = useAppDispatch();
  const [editMode, setEditMode] = useState(false);

  const { collapsed } = useAppSelector(state => state.app);
  const { menuTrees: [First, ...Others], favorites, defaultOpenKeys } = useAppSelector(state => state.menu);

  // defaultOpenKeys.push(Favorites.id);

  const dok = [...defaultOpenKeys];
  dok.push(Favorites.id);

  // 收藏夹
  Favorites.children = favorites.map(item => {
    const _item = {...item};
    _item.url = _item.url + '?fav';
    return _item;
  });

  const menuTrees = [Favorites, ...Others];


  useEffect(() => {
    dispatch(fetchMenuThunkAction);

    MenuService.badges().then(res => {
      setBadgeMap(res);
    });
  }, [dispatch]);

  // const asideMenu = renderMenu(menuTrees, badgeMap);
  const currentURL = location.pathname + location.search;

  return (
    <aside className='app-aside'>
      <div className='app-menu'>
        {menuTrees.length > 1 && (
          <Menu
            mode='inline'
            inlineCollapsed={collapsed}
            selectedKeys={[currentURL, location.pathname]}
            defaultOpenKeys={collapsed ? [] : dok}
            // items={items}
            inlineIndent={0}
            forceSubMenuRender={true}
          >
            {/* 后台首页 */}
            <Item key={First.url}>
              <Link to={First.url}>
                {<i className={`icon iconfont icon-${First.icon}`} />}
                <TitleWithBadge badge={{}}>
                  <span>{First.title}</span>
                </TitleWithBadge>
              </Link>
            </Item>

            <Divider />

            {menuTrees.map(submenu => {
              const isFavorites = submenu.code === Favorites.code;
              const isEditMode = isFavorites && editMode;
              const badge = badgeMap && badgeMap.get && badgeMap.get(submenu.id);

              if (submenu?.children?.length > 0 || isFavorites) {
                return [
                  <SubMenu
                    className={isFavorites && 'fav-submenu'}
                    key={submenu.id}
                    title={
                      <>
                        <span className='submenu-title'>
                          {submenu.icon ? <i className={`icon iconfont icon-${submenu.icon}`} /> : null}
                          <span className='submenu-title-text'>{submenu.title}</span>

                          {editMode && isFavorites ? (
                            <span className='fav-submenu-count'>已添加{favorites?.length}/10</span>
                          ) : null}
                        </span>

                        {isFavorites && (
                          <span
                            className={`fav-submenu-${editMode ? 'save' : 'setting'}`}
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();

                              

                              if(editMode) {
                                MenuService.update({
                                  favorites
                                }).finally(() => {
                                  setEditMode(false);
                                })
                              } else {
                                setEditMode(true);
                              }

                              
                            }}
                          >
                            {editMode ? '保存' : '管理'}
                          </span>
                        )}
                      </>
                    }
                    // icon={<i className={`icon iconfont icon-${icon}`} />}
                  >
                    {submenu?.children &&
                      submenu?.children.map(item => {
                        const badge = badgeMap && badgeMap.get && badgeMap.get(item.id);
                        const added = !!favorites.find(fav => fav.id === item.id);

                        // 编辑模式
                        if (editMode) {
                          return (
                            <Item
                              key={item.url}
                              className={classNames('fav-item-edit', {
                                'fav-item-added': added,
                              })}

                              onClick={() => {
                                console.log(item, added);

                                if(added) {
                                  dispatch(removeFavMenuItem(item));
                                } else {
                                  if (favorites.length >= 10) {
                                    message.error('已达最大添加限制');
                                    return;
                                  }
                                  dispatch(insertFavMenuItem(item));
                                }
                              }}
                            >
                              <TitleWithBadge badge={badge}>
                                <span>{item.title}</span>
                              </TitleWithBadge>

                              {added ? (
                                <><MinusCircleOutlined className='outlined' /><MinusCircleFilled className='filled' /></>
                              ) : (
                                <><PlusCircleOutlined className='outlined' /><PlusCircleFilled  className='filled' /></>
                              )}
                            </Item>
                          );
                        }

                        return (
                          <Item key={item.url}>
                            <Link to={item.url}>
                              {<i className={`icon iconfont icon-${item.icon}`} />}
                              <TitleWithBadge badge={badge}>
                                <span>{item.title}</span>
                              </TitleWithBadge>
                            </Link>
                          </Item>
                        );
                      })}
                  </SubMenu>,
                  isEditMode && <li className='nav-edit-hint'>点击下方功能入口即可添加</li>,
                  !submenu.last && <Divider />,
                ];
              }

              return [
                <Item key={submenu.url}>
                  <Link to={submenu.url}>
                    {<i className={`icon iconfont icon-${submenu.icon}`} />}
                    <TitleWithBadge badge={badge}>
                      <span>{submenu.title}</span>
                    </TitleWithBadge>
                  </Link>
                </Item>,
                !submenu.last && <Divider />,
              ];
            })}
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
