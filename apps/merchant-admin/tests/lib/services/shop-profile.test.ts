import { expect, test, vi } from 'vitest';

const { apiFetchMock } = vi.hoisted(() => ({ apiFetchMock: vi.fn() }));

vi.mock('@/lib/api-client', () => ({ apiFetch: apiFetchMock }));

import { fetchMyMerchant, updateMyShop } from '@/lib/services/shop-profile';

test('读取当前商家的商家与店铺', async () => {
  apiFetchMock.mockResolvedValue({ id: 'merchant-demo-1', shops: [{ id: 'shop-demo-1' }] });
  const result = await fetchMyMerchant();
  expect(apiFetchMock).toHaveBeenCalledWith('/api/bff/merchants/me');
  expect(result.shops[0].id).toBe('shop-demo-1');
});

test('更新店铺资料只发送允许字段', async () => {
  apiFetchMock.mockResolvedValue({ id: 'shop-demo-1' });
  await updateMyShop('shop-demo-1', { description: '新简介', externalLink: 'https://example.com' });
  expect(apiFetchMock).toHaveBeenCalledWith('/api/bff/shops/shop-demo-1', {
    method: 'PATCH',
    body: { description: '新简介', externalLink: 'https://example.com' },
  });
});
