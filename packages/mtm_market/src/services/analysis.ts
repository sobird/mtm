/**
 * 数据分析
 *
 * sobird<i@sobird.me> at 2023/10/12 7:49:38 created.
 */

import http from '@mtm/shared/utils/http';
import dayjs from '@/utils/dayjs';

export interface IWorkbenchResponse {
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

export interface IOperationResponse {
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

interface ITrendingParams {
  poiId?: number;
  startTime: number;
  endTime: number;
}

interface ILineChartData {
  xField?: string;
  yField?: number;
}
/** 商家经营趋势 */
export interface ITrendingResponse {
  transactionLine: ILineChartData[];
  paymentAmountLine: ILineChartData[];
  reviewLine: ILineChartData[];
  serviceReplyRateLine: ILineChartData[];
}

function mockTrending(duration = 30, size: number = 100) {
  return Array.from({ length: duration }, (_, index: number) => ({
    date: dayjs()
      .subtract(duration - index, 'day')
      .format('YYYY-MM-DD'),
    value: Math.round(Math.random() * size),
  }));
}

const AnalysisService = {
  /** 商家工作台 */
  workbench(poiId: number) {
    return http.get<IWorkbenchResponse>('/analysis/workbench', { poiId });
  },
  /** 商家运营 数据 */
  operation(poiId: number) {
    return http.get<IOperationResponse>('/analysis/operation', { poiId });
  },
  /** 经营趋势 */
  trending(params: ITrendingParams) {
    return http.get<ITrendingResponse>('/analysis/trending', params).then(res => {
      // mock 数据
      const duration = dayjs.duration(dayjs(params?.endTime).diff(dayjs(params?.startTime))).days();

      return {
        transactionLine: mockTrending(duration, 100),
        paymentAmountLine: mockTrending(duration, 10000),
        reviewLine: mockTrending(duration, 200),
        serviceReplyRateLine: mockTrending(duration, 100),
      } as ITrendingResponse;
    });
  },
};

export default AnalysisService;
