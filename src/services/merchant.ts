/**
 * 商家服务接口
 *
 * sobird<i@sobird.me> at 2023/10/24 0:06:13 created.
 */

import { http } from '@mtm/shared';
import {
  IMerchantEntity,
  IMerchantCategory,
  IMerchantSignContractRequest,
  IMerchantEntryEntity,
  IMerchantOptions,
  IMerchantType,
  IMerchantTask,
} from './merchant.d';

export * from './merchant.d';

export enum MerchantLogoAuditStatusEnum {
  '审核中' = 4,
  '审核驳回' = 5,
  '审核通过' = 6,
}

/** 根据categoryId获取类目路径 */
export function getCategoryPath(categoryId: number, categoryList: IMerchantCategory[]) {
  const item = categoryList.find(item => { return item.id === categoryId; });
  const category = [item];
  let { parentId } = item;

  while (parentId) {
    const item = categoryList.find(item => { return item.id === parentId; });
    category.unshift(item);
    parentId = item.parentId;
  }

  return category;
}

const MerchantService = {
  /** 获取当前商家详情 */
  detail() {
    return http.get<IMerchantEntity>('/merchant/detail');
  },
  /** 更新当前商家信息 */
  update(data: Partial<IMerchantEntity>) {
    return http.patch('/merchant', data);
  },
  /** 获取商家主营类目列表 */
  category(parentId?: number) {
    return http.get<IMerchantCategory[]>('/merchant/category', { parentId });
  },
  /** 商家合同签约 */
  signContract(data: IMerchantSignContractRequest) {
    return http.post('/merchant/contract/sign', data);
  },
  /** 获取商家入住信息 */
  entryDetail(entryTaskId?: number) {
    return http.get<IMerchantEntryEntity>('/merchant/entry', {
      entryTaskId,
    });
  },
  /** 更新商家入住信息 */
  updateEntry(data: IMerchantEntryEntity) {
    return http.patch('/merchant/entry', data);
  },
  /** 获取商家枚举数据 */
  options(entryTaskId?: number) {
    return http.get<IMerchantOptions>('/merchant/options', { entryTaskId });
  },
  /** 获取商家类型列表 */
  type() {
    return http.get<IMerchantType[]>('/merchant/entry/type');
  },
  /** 商家任务 */
  task() {
    return http.get<IMerchantTask>('/merchant/entry/task');
  },

  // 钱包相关接口

  /** 创建钱包 */
  createWallet() {
    return http.post('/merchant/wallet');
  },

  /** 切换企业钱包与个人钱包 */
  toggleWallet() {
    return http.put('/merchant/wallet');
  },

  /** 许可证列表 */
  licenses() {
    return http.get('/merchant/licenses');
  },
};

export default MerchantService;
