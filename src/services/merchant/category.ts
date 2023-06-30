/**
 * 主营类目
 * 
 * sobird<i@sobird.me> at 2023/06/25 0:57:36 created.
 */

import http from "@/utils/http";


export interface ICategory {
  id: number;
  parentId: number;
  name: string;
  level: number;
  leaf: number;
  [key: string]: any;
}

export default async function category(parentId?: number) {
  return http.get<ICategory[]>('/merchant/category', { parentId }).then(res => {
    return toTree(res);
  });
}

export function toTree(list: ICategory[]) {
  const result = [];
  const map = new Map();
 
  list.forEach(item => {
    if (!item.children) {
      item.children = []
    }
    map.set(item.id, item);
  })
 
  list.forEach(item => {
    const parent = map.get(item.parentId);
    if (parent) {
      parent.children.push(item);
    } else {
      result.push(item);
    }
  })
  return result;
}