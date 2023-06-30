/**
 * type.ts
 * 
 * sobird<i@sobird.me> at 2023/06/30 16:47:52 created.
 */

import http from "@/utils/http";

export interface IEntryType {
  poiType: number;
  poiTypeName: string;
  poiTypeDesc: string;
  state: number;
  setPoiType: boolean;
  setPoiTypeName: boolean;
  setState: boolean;
}

export default {
  get() {
    return http.get<IEntryType[]>('/merchant/entry/type');
  }
}