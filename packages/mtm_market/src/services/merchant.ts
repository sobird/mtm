/**
 * 商家服务
 * 
 * sobird<i@sobird.me> at 2023/10/13 0:21:44 created.
 */

import http from '@mtm/shared/utils/http';

const MerchantService = {
  tasks(poiId: number) {
    return http.get('/merchant/task/list', { poiId });
  },
};

export default MerchantService;
