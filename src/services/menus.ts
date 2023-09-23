/**
 * 商家后台菜单
 * 
 * sobird<i@sobird.me> at 2023/09/21 14:17:06 created.
 */

import { listToTree } from "@/utils";
import http from "@/utils/http";

/**
 * 主营类目
 */
export interface IMenuItem {
  title: string;
  icon: string;
  url: string;
  id: number | string,
  parentId: string;
  code: string;
  auth: boolean;
  index: number;
  level: number;
  sortId: number;
  toolMenu: boolean;
  children?: IMenuItem[];
}

export interface IMenus {
  menus: IMenuItem[],
  favorites: IMenuItem[]
}

export interface IMenuBadge {
  menuId: number;
  actionType?: 10 | 20;
  noticeStyle: 10 | 20 | 30;
  noticeContent: string;
}


const FavoriteFold: IMenuItem = {
  title: '常用功能',
  code: "favorite-sub-menu",
  icon: 'favorite',
  id: "favorite-sub-menu",
  index: 1,
  level: 0,
  parentId: '-1',
  sortId: 0,
  auth: false,
  toolMenu: false,
  url: '/favorite-sub-menu',
};

const MenusService = {
  async list(parentId?: number) {
    return http.get<IMenus>('/menus', { parentId }).then(res => {
      const menus = res.menus.sort((a: any, b: any) => a.index - b.index);

      const [first, ...others] = listToTree(menus);
      FavoriteFold.children = res.favorites.map(item => {
        item.url = item.url + '?fav'
        return item;
      })

      return [first, FavoriteFold, ...others]
    });
  },

  favorite(favorites?: Partial<IMenuItem>[]) {
    return http.patch('/menus', { favorites });
  },

  /** 可将此接口合并到 /menus */
  badges(menuId?: number) {
    return http.get<IMenuBadge[]>('/menus/badges', { menuId }).then(res => {
      return (
        res?.reduce((pre, cur) => {
          if (!cur?.menuId) {
            return pre;
          }
          pre[`${cur?.menuId}`] = cur;
          return pre;
        }, {}) || {}
      );
    });
  },
}

export default MenusService;
