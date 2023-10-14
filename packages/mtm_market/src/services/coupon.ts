/**
 * 优惠券服务
 *
 * sobird<i@sobird.me> at 2023/09/15 21:58:06 created.
 */

import http from '@mtm/shared/utils/http';

interface ISpu {
  /** SPU ID */
  id: string;
  /** SPU名称 */
  name: string;
  /** SPU状态; 0:已下架, 1:已上架 */
  status: number;
  /** 库存 */
  stock: number;
  /** 最低价 */
  minPrice: number;
  /** 当前SPU下的SKU数量 */
  skuCount: number;
}

export interface ICouponEntity {
  /** 优惠券ID */
  id: string;
  /** 优惠券名称 */
  name: string;
  /** 优惠券文案 */
  displayName: string;
  /** 优惠券类型; 0:满减券, 1:折扣券 */
  type: 0 | 1;
  /** 发券目标 */
  target: 1 | 2 | 3;
  /** 优惠券 门槛, 面额 */
  rule: [number, number];
  /** 优惠券库存 */
  stock: number;
  /** 每人限领张数 */
  limit: number;
  /** 发放时间段 开始时间, 结束时间 */
  putTerm: [number, number];
  /** 投放目标人群 -1:全部用户 新老客, 1:老客, 2:新老客 */
  putCrowd: -1 | 1 | 2;
  /**
   * 使用期限 单位: 天
   *
   * 先判断useTerm[0]的值，该值 >0 认为 是券领取X天内有效;
   * 该值<=0 或 false，认为是在useTerm[1]到useTerm[2]期间券可以进行使用
   */
  useTerm: [number, [number, number]];
  /** 使用人群 */
  useCrowd: -1 | 1 | 2;
  /** 投放位置 */
  position: number;
  /** 发放数量 */
  sendCount: number;
  /** 当前余量 */
  leftCount: number;
  /** 优惠券状态; 未开始:0, 已开始(进行中):1, 已结束:2, 已撤销(已下线):6 */
  status: 0 | 1 | 2 | 6;
  /** 创建时间 时间戳 */
  ctime: number;
  /** 优惠券商品列表 */
  spuList: ISpu[];
  /** SPU ID 列表 */
  spuIds: [];
  /** 商家ID列表 */
  wmPoiIds: number[];
}

export interface ICouponPagination {
  ps?: number;
  pn?: number;
  total: number;
  list: ICouponEntity[];
}

export const CouponTypeMap = new Map([
  [0, '满减券'],
  [1, '折扣券'],
]);

export enum CouponTargetEnum {
  '店铺商品券' = 1,
  '店铺通用券' = 2,
  '店铺客服体验券' = 3,
}

export const CouponTargetMap = new Map([
  [1, '店铺商品券'],
  [2, '店铺通用券'],
  [3, '店铺客服体验券'],
]);

export enum CouponStatusEnum {
  '全部' = -1,
  '未开始' = 0,
  '进行中' = 1,
  '已结束' = 2,
  '已下线' = 6,
}

export const CouponStatusMap = new Map([
  [-1, '全部'],
  [0, '未开始'],
  [1, '进行中'],
  [2, '已结束'],
  [6, '已下线'],
]);

export const CouponStatusColorMap = new Map([
  [-1, ''],
  [0, 'gray'],
  [1, 'green'],
  [2, 'blue'],
  [6, 'red'],
]);

export const CouponLimitCountMap = new Map([
  [1, '1张'],
  [2, '2张'],
  [3, '3张'],
  [4, '不限'],
]);

export interface ICouponsParams {
  ps?: number;
  pn?: number;
  status?: number;
  stime?: number;
  etime?: number;
}

const CouponService = {
  async list(params?: ICouponsParams) {
    return http.get<ICouponPagination>('/merchant/coupon', params);
  },
  detail(id: string) {
    return http.get<ICouponEntity>('/merchant/coupon/detail', { id });
  },
  delete(id: string) {
    return http.delete<ICouponEntity>('/merchant/coupon', { id });
  },
  create(data: ICouponEntity) {
    return http.post<ICouponEntity>('/merchant/coupon', data);
  },
  update(data: ICouponEntity) {
    return http.patch<ICouponEntity>('/merchant/coupon', data);
  },
};

// utils

export const isEdit = (status = 10) => {
  return status < 2;
}

export default CouponService;
