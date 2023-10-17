/**
 * 商家后台菜单
 *
 * sobird<i@sobird.me> at 2023/09/21 14:17:06 created.
 */

import { listToTree } from '@/utils';
import http from '@/utils/http';

export interface IMenuItem {
  title: string;
  icon: string;
  url: string;
  id: number | string;
  parentId: string;
  code: string;
  auth: boolean;
  index: number;
  level: number;
  sortId: number;
  toolMenu: boolean;
  children?: IMenuItem[];
}

export interface IMenuListResponse {
  menuItems: IMenuItem[];
  favorites: IMenuItem[];
}

export interface IMenuBadge {
  menuId: number;
  actionType?: 10 | 20;
  noticeStyle: 10 | 20 | 30;
  noticeContent: string;
}

const Favorites: IMenuItem = {
  title: '常用功能',
  code: 'favorite-sub-menu',
  icon: 'favorite',
  id: 'favorite-sub-menu',
  index: 1,
  level: 0,
  parentId: '-1',
  sortId: 0,
  auth: false,
  toolMenu: false,
  url: '/favorite-sub-menu',
};

const MenuService = {
  async list(parentId?: number) {
    return http.get<IMenuListResponse>('/menu', { parentId }).then(({menuItems = [], favorites = []}) => {
      const items = menuItems.sort((a: any, b: any) => a.index - b.index);
      const [First, ...Others] = listToTree(items);

      Favorites.children = favorites.map(item => {
        item.url = item.url + '?fav';
        return item;
      });

      return [First, Favorites, Others, menuItems, favorites];
    });
  },

  async update(favorites?: Partial<IMenuItem>[]) {
    return http.patch('/menu', { favorites });
  },

  /** 可将此接口合并到 /menu */
  async badges(menuId?: number) {
    return http.get<IMenuBadge[]>('/menu/badges', { menuId }).then(res => {
      const badgeMap = new Map();
      return res?.reduce((pre, cur) => {
        if (!cur?.menuId) {
          return pre;
        }
        pre.set(cur?.menuId, cur);
        return pre;
      }, badgeMap);
    });
  },
};

export default MenuService;
