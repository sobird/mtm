import type { MerchantDetailDTO, ShopDTO, ShopUpdateInput } from '@mtm/contracts';

import { apiFetch } from '@/lib/api-client';

/** 读取当前登录商家的商家信息与店铺列表（由 BFF 从会话派生 merchantId）。 */
export function fetchMyMerchant(): Promise<MerchantDetailDTO> {
  return apiFetch<MerchantDetailDTO>('/api/bff/merchants/me');
}

/** 更新当前商家名下指定店铺的资料。 */
export function updateMyShop(shopId: string, input: ShopUpdateInput): Promise<ShopDTO> {
  return apiFetch<ShopDTO>(`/api/bff/shops/${shopId}`, { method: 'PATCH', body: input });
}
