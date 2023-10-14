/**
 * 违规管理
 *
 * sobird<i@sobird.me> at 2023/10/14 13:43:18 created.
 */

import http from '@mtm/shared/utils/http';

export interface Option {
  value: number | string;
  label: string;
}

export interface IViolation {
  // # 违规编号
  issueId?: number;
  // # 违规大类别
  issueCategory?: Option;
  // # 违规类别
  issueType?: Option;
  // # 违规上报日期，yyyy-MM-dd
  issueDate?: string;
  // # 违规上报具体时间，yyyy-MM-dd HH:mm:ss
  issueTime?: string;
  // # 申诉截止时间，yyyy-MM-dd HH:mm:ss,用于倒计时
  appealExpireTime?: string;
  // # 违规处罚状态
  issueState?: Option;
  // # 违规申诉id，如果没有则为空
  appealId?: number;
  // # 违规申诉状态
  appealState?: Option;
  // # 商家id
  merchantId?: number;
  // # 商家名称
  merchantName?: string;
  // # 违规行为文字描述
  issueContent?: string;
  // # 处罚文字描述
  ticketContent?: string;
  // # 违规对应实体的简单描述，目前只有订单
  payload?: {
    orderViewId: string;
    productId: string;
    productName: string;
  };
  // 是否可以申诉
  appealPermit?: Option;
  // 申诉3状态打平
  appealStateView?: Option;
  // 违规来源 人工处罚manual 风控rc 商家治理检测mgov.detector
  issueSource: string;
  tickets?: any;
}

export interface IViolationListResponse {
  pn: string;
  ps: number;
  total: number;
  list: IViolation[];
}

export interface IViolationOverviewResponse {
  issueCount: number;
  appealCount: number;
  ticketAmount: number;
}

const ViolationService = {
  /** 获取违规列表 */
  list(poiId?: number) {
    return http.get<IViolationListResponse>('/violation/list', { poiId });
  },
  /** 获取各种类型接口，处罚类型等 */
  type(poiId?: number) {
    return http.get('/violation/type', { poiId });
  },
  /** 获取违规信息详情 */
  detail(issueId?: number) {
    return http.get('/violation/detail', { issueId });
  },

  overview(poiId?: number) {
    return http.get<IViolationOverviewResponse>('/violation/overview', { poiId });
  },
};

export default ViolationService;
