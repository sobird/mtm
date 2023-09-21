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
  id: number,
  parentId: string;
  code: string;
  auth: boolean;
  index: number;
  level: number;
  sortId: number;
  toolMenu: boolean;
}

export interface IMenus {
  menus: IMenuItem[],
  favorites: IMenuItem[]
}

const MenusService = {
  list(parentId?: number) {
    return http.get<IMenus>('/menus', { parentId }).then(res => {
      const menus = listToTree(res.menus);
      const favorites = listToTree(res.favorites);
      return {
        menus,
        favorites
      }
    });
  },

  favorite(favorites?: Partial<IMenuItem>[]) {
    return http.patch('/menus', { favorites });
  },
}

export default MenusService;
