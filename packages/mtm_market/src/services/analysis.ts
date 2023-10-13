/**
 * 数据分析
 *
 * sobird<i@sobird.me> at 2023/10/12 7:49:38 created.
 */

import http from '@mtm/shared/utils/http';

export interface IWorkbench {
  overview: {
    /** 待付款 未支付订单数 */
    unpaidOrderCount: number;
    /** 待发货 */
    unfilledOrderCount: 53;
    /** 退款/售后 */
    refundOrderCount: 12;
    /** 即将延迟发货 */
    willDelayDeliverOrderCount: 6;
    /** 已延期发货 */
    delayedDeliverOrderCount: 4;
  };
  realdata: {
    /** 支付金额 */
    paidAmount: 2445;
    /** 支付订单数 */
    paidOrderCount: 132;
    /** 支付人数 */
    paidUserCount: 98;
    /** 商品浏览量 Item Page View*/
    itemPaveView: 873;
    /** 商品访客量 IPV_UV */
    itemUniqueVisitor: 523;
    /** 支付转化率 CVR */
    conversionRate: 10;
  };
}

export interface IOperation {
  scoreSet: {
    serviceScoreJudge: number;
    overallScoreJudge: number;
    serviceScore: number;
    overallScore: number;
  };
  rateSet: {
    customerReplyRate: number;
    collectOnTimeRate: number;
    newlyReviewCount: number;
  };
}

const AnalysisService = {
  /** 商家工作台 */
  workbench(poiId: number) {
    return http.get<IWorkbench>('/analysis/workbench', { poiId });
  },
  /** 商家运营 数据 */
  operation(poiId: number) {
    return http.get<IOperation>('/analysis/operation', { poiId });
  },
};

export default AnalysisService;
