/**
 * 商家服务接口
 *
 * sobird<i@sobird.me> at 2023/10/24 0:06:13 created.
 */

import { http } from '@mtm/shared';
import { IMerchantEntity } from './merchant.d';

const MerchantService = {
  /** 获取当前商家详情 */
  detail() {
    return http.get<IMerchantEntity>('/merchant/detail');
  },
  /** 更新当前商家信息 */
  update(data: Partial<IMerchantEntity>) {
    return http.patch('/merchant', data);
  }
};

export default MerchantService;
