/**
 * 主营类目
 * 
 * sobird<i@sobird.me> at 2023/06/25 0:57:36 created.
 */

import http from "@/utils/http";

/**
 * 主营类目
 */
export interface ICategory {
  id: number;
  parentId: number;
  name: string;
  level: number;
  leaf: number;
  [key: string]: any;
}

const CategoryService = {
  get(parentId?: number) {
    return http.get<ICategory[]>('/merchant/category', { parentId });
  }
}

export default CategoryService;
