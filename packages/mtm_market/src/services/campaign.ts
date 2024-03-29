/**
 * 营销活动服务
 * 
 * sobird<i@sobird.me> at 2023/09/14 15:24:37 created.
 */

import { http } from '@mtm/shared';

export interface ICampaignListQuery {
  ps?: number;
  pn?: number;
  type?: string;
  max?: number;
}

export interface ICampaignEntity {
  id: number;
  name: string;
  type: number;
  startTime: string;
  endTime: string;
  applyStartTime: string;
  applyEndTime: string;
  startTimeStr: string;
  endTimeStr: string;
  applyStartTimeStr: string;
  applyEndTimeStr: string;
  applyStatus: number;
  applySpuCount: number;
  applySkuCount: number;
  minStock: number;
  maxStock: number;
  intro: string;
  cover: string;
  sug: string;
  faq: string;
  canFillApplyPrice: boolean;
  canFillActStock: boolean;
  canClickApply: boolean;
  cannotClickApplyReason: boolean;
  extField: string;
}

export interface ICampaignListResponse {
  pn: number;
  ps: number;
  total: number;
  list: ICampaignEntity[]
}

const CampaignService = {
  async list(query?: ICampaignListQuery) {
    return http.get<ICampaignListResponse>('/merchant/campaigns', query).then(res => {
      res.list = res.list?.slice(0, query.max);
      return res;
    });
  },

  async detail(id: number) {
    return http.get('/merchant/campaigns', { id });
  }
}

export default CampaignService
