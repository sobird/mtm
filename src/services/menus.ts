/**
 * 商家后台菜单
 * 
 * sobird<i@sobird.me> at 2023/09/21 14:17:06 created.
 */

import http from "@/utils/http";

/**
 * 主营类目
 */
export interface IMenu {
  title: string;
  icon: string;
  url: string;
  id: 19207,
  parentId: string;
  code: string;
  auth: boolean;
  index: number;
  level: number;
  sortId: number;
  toolMenu: boolean;
}

const MenusService = {
  list(parentId?: number) {
    return http.get<IMenu[]>('/menus', { parentId });
  }
}

export default MenusService;
