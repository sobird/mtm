/**
 * 商品
 * 
 * sobird<i@sobird.me> at 2023/10/13 18:57:07 created.
 */

import { http } from '@mtm/shared';

interface ISellingProduct {
  total: number;
  items: [];
}

const ProductService = {
  /** 正在卖的商品 默认查询当前登录的商家店铺商品 **/
  selling(poiId?: number) {
    return http.get<ISellingProduct>('/product/selling', { poiId });
  },
};

export default ProductService;