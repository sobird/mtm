/**
 * 优惠券服务
 * 
 * sobird<i@sobird.me> at 2023/09/15 21:58:06 created.
 */

import http from "@mtm/shared/utils/http";


export interface ICouponListParams {
  ps?: number;
  pn?: number;
  status?: number;
  stime?: number;
  etime?: number;
}

interface ISpu {
  spuId: number;
  spuName: string;
  shelfStatus: number;
  stock: number;
  lowSellPrice: number;
  skuCount: number;
}

export interface ICouponEntity {
  id: number;
  name: string;
  displayName: string;
  stime: number;
  etime: number;
  type: number;
  stock: number;
  price: number;
  discount: number;
  limitCount: number;
  validDays: number;
  useStime: number;
  useEtime: number;
  spuIds: [];
  target: number;
  position: number;
  useScope: string;
  ticketType: number;
  useRange: string;
  spuList: ISpu[];
  wmPoiIds: number[]
}

export interface ICouponPagination {
  ps?: number;
  pn?: number;
  total: number;
  list: ICouponEntity[]
}

export enum ECouponType {
  "满减券" = 0,
  "折扣券" = 1
}

export enum ECouponTarget {
  "店铺通用券" = 11,
  "店铺客服体验券" = 12
}

export enum ECouponStatus {
  "全部" = -1,
  "未开始" = 0,
  "进行中" = 1,
  "已结束" = 2,
  "已下线" = 6
}

export enum ECouponStatusColor {
  "gray" = 0,
  "green" = 1,
  "blue" = 2,
  "red" = 6
}

const CouponService = {
  list(params?: ICouponListParams) {
    return http.get<ICouponPagination>('/merchant/coupons', params);
  },
  detail(id: number) {
    return http.get<ICouponPagination>('/merchant/coupons', { id });
  },
  delete(id: number) {
    return http.delete<ICouponEntity>('/merchant/coupons', { id });
  },
  create(data: ICouponEntity) {
    return http.post<ICouponEntity>('/merchant/coupons', data);
  },
  update(data: ICouponEntity) {
    return http.patch<ICouponEntity>('/merchant/coupons', data);
  }
}

export default CouponService;
