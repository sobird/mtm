import { PERMISSIONS } from '@mtm/contracts';
import { PermissionProvider, ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ apiFetchWithMeta: vi.fn(), apiFetch: vi.fn(), push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn() }),
  usePathname: () => '/products',
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: mocks.apiFetch,
  apiFetchWithMeta: mocks.apiFetchWithMeta,
  ApiError: class ApiError extends Error {
    readonly code = 'ERROR';
    readonly status = 500;
  },
}));

import { ProductManager } from '@/components/product/ProductManager';

const DRAFT_ROW = {
  id: 'p1',
  code: 'P1001',
  title: '测试沙发',
  mainImageUrl: 'data:image/svg+xml;utf8,<svg/>',
  categoryId: 'c1',
  categoryName: '沙发',
  brandId: null,
  brandName: null,
  shopId: 's1',
  shopName: '旗舰店',
  merchantId: 'merchant-demo-1',
  merchantName: '青禾家居有限公司',
  status: 'DRAFT' as const,
  version: 1,
  currentVersionId: 'v1',
  publishedVersionId: null,
  updatedAt: '2026-11-04T00:00:00.000Z',
};

function renderManager() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider permissions={Object.values(PERMISSIONS)}>
          <ProductManager />
        </PermissionProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.apiFetchWithMeta.mockResolvedValue({
    data: [DRAFT_ROW],
    meta: { page: 1, pageSize: 10, total: 1 },
  });
  mocks.apiFetch.mockResolvedValue({});
});

test('渲染商品列表并按状态展示操作', async () => {
  renderManager();

  expect(await screen.findByText('测试沙发')).toBeInTheDocument();
  expect(screen.getByText('草稿')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '提交审核' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '编辑' })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '提交审核' }));
  await waitFor(() => expect(mocks.apiFetch).toHaveBeenCalledWith('/api/bff/products/p1/submit', { method: 'POST' }));
});

test('新建商品跳转到表单页', async () => {
  renderManager();
  await screen.findByText('测试沙发');

  await userEvent.click(screen.getByRole('button', { name: '新建商品' }));
  expect(mocks.push).toHaveBeenCalledWith('/products/new');
});
