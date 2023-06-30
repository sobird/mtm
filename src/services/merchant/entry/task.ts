/**
 * task.ts
 * 
 * sobird<i@sobird.me> at 2023/06/30 16:39:58 created.
 */

import http from "@/utils/http";

export interface IEntryTaskResponseData {
  entryTaskId: number;
  bizType: number;
  localCommerce: number;
}

export default {
  get() {
    return http.get<IEntryTaskResponseData>('/merchant/entry/task');
  }
}