/**
 * 商家服务
 *
 * sobird<i@sobird.me> at 2023/10/13 0:21:44 created.
 */

import http from '@mtm/shared/utils/http';

interface GoldParams {
  poild: number;
  periodType: number;
}

export interface IStandardItem {
  key: string;
  /** 指标名称 */
  name: string;
  /** 指标 */
  desc: string;
  /** 状态 进度 */
  progress: string;
  url: string;
  /** 是否达标 */
  qualified: 0 | 1;
}
export interface IGoldResponse {
  lastPeriodStatus: 1 | 2 | 3 | 4;
  currentPeriodSTime: string;
  currentPeriodETime: string;
  standards: IStandardItem[];
}

const MerchantService = {
  tasks(poiId: number) {
    return http.get('/merchant/task/list', { poiId });
  },

  gold(params: GoldParams) {
    return http.get<IGoldResponse>('/merchant/gold', params);
  },
};

export default MerchantService;
