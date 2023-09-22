/**
 * index.ts
 * 
 * sobird<i@sobird.me> at 2023/06/30 19:48:37 created.
 */

import { TopNavHeader } from "@ant-design/pro-layout";

/**
 * 实现表格数据相同的行合并
 * 
 * @param data any[]
 * @param key string
 * @returns
 */
export function getRowSpans (data: any[], key: string) {
  let sameValueLength = 0;
  const rowSpans = [];
  for(let i = data.length - 1; i >= 0; i--){
    if(i === 0) {
      rowSpans[i] = sameValueLength + 1;
      continue;
    }
    if(data[i][key] === data[i-1][key]) {
      rowSpans[i] = 0;
      sameValueLength++;
    } else {
      rowSpans[i] = sameValueLength + 1;
      sameValueLength = 0;
    }
  }
  return rowSpans;
}

export interface IList {
  id: number | string;
  parentId: string;
  name?: string;
  title: string;
  [key: string]: any;
}

/**
 * 将数组转换为树结构
 * 
 * @param list 
 * @returns 
 */
export function listToTree(list: IList[]) {
  const result = [];
  const map = new Map();

  list.forEach(item => {
    if (!item.children) {
      //item.children = []
    }
    map.set(item.id, item);
  })

  list.forEach(item => {
    const parent = map.get(item.parentId);
    if (parent) {
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(item);
    } else {
      result.push(item);
    }
  })
  return result;
}
