/**
 * index.ts
 * 
 * sobird<i@sobird.me> at 2023/06/30 20:24:10 created.
 */

import http from "@/utils/http";

export interface IEntryRequestData {
  baseInfo?: {
    category: number;
    poiType: number;
    taskId: number;
  }
}

export default {
  post(data: IEntryRequestData) {
    return http.post('/merchant/entry', data);
  }
}