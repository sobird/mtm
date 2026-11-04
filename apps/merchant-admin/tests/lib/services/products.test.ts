import { beforeEach, expect, test, vi } from 'vitest';

const { apiFetchMock, apiFetchWithMetaMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  apiFetchWithMetaMock: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: apiFetchMock,
  apiFetchWithMeta: apiFetchWithMetaMock,
}));

import { publishProduct, fetchProducts, submitProduct, uploadProductImage } from '@/lib/services/products';

beforeEach(() => {
  apiFetchMock.mockReset();
  apiFetchWithMetaMock.mockReset();
});

test('商品列表把过滤参数转成 query', async () => {
  apiFetchWithMetaMock.mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, total: 0 } });

  await fetchProducts({ page: 2, pageSize: 10, keyword: '沙发', status: 'DRAFT' });

  expect(apiFetchWithMetaMock).toHaveBeenCalledWith('/api/bff/products', {
    query: { page: 2, pageSize: 10, keyword: '沙发', status: 'DRAFT' },
  });
});

test('提交与发布调用动作端点', async () => {
  apiFetchMock.mockResolvedValue({});

  await submitProduct('p1');
  await publishProduct('p1');

  expect(apiFetchMock).toHaveBeenNthCalledWith(1, '/api/bff/products/p1/submit', { method: 'POST' });
  expect(apiFetchMock).toHaveBeenNthCalledWith(2, '/api/bff/products/p1/publish', { method: 'POST' });
});

test('上传以 multipart 发送并返回 url', async () => {
  apiFetchMock.mockResolvedValue({ id: 'm1', url: '/uploads/x.png' });
  const file = new File(['x'], 'x.png', { type: 'image/png' });
  const form = new FormData();
  form.append('file', file);

  await expect(uploadProductImage(file)).resolves.toEqual({ id: 'm1', url: '/uploads/x.png' });
  expect(apiFetchMock).toHaveBeenCalledWith('/api/bff/uploads/images', { method: 'POST', body: expect.any(FormData) });
});
