import { PERMISSIONS } from '@mtm/contracts';
import { PermissionProvider, ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ apiFetchWithMeta: vi.fn(), apiFetch: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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

import { ProductManager } from '@/components/catalog/ProductManager';

const ROW = {
  id: 'p1',
  code: 'P1001',
  title: '北欧沙发',
  mainImageUrl: 'data:image/svg+xml;utf8,<svg/>',
  categoryId: 'c1',
  categoryName: '沙发',
  brandId: null,
  brandName: null,
  shopId: 's1',
  shopName: '旗舰店',
  merchantId: 'merchant-demo-1',
  merchantName: '青禾家居有限公司',
  status: 'PUBLISHED' as const,
  version: 1,
  currentVersionId: 'v1',
  publishedVersionId: 'v1',
  updatedAt: '2026-11-04T00:00:00.000Z',
};

const DETAIL = {
  ...ROW,
  currentVersion: {
    id: 'v1',
    version: 1,
    status: 'PUBLISHED',
    title: '北欧沙发',
    subtitle: null,
    mainImageUrl: ROW.mainImageUrl,
    images: [ROW.mainImageUrl],
    description: '舒适',
    attributes: { 'attr-1': '棉麻' },
    createdBy: 'account-1',
    createdAt: ROW.updatedAt,
    submittedAt: ROW.updatedAt,
    reviewedAt: ROW.updatedAt,
    publishedAt: ROW.updatedAt,
    skus: [{ id: 's1', skuCode: 'P1001-A', specs: { 规格: '三人位' }, price: '2599.00', stock: 10, status: 'ACTIVE' }],
  },
  publishedVersion: null,
  versions: [],
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
  mocks.apiFetchWithMeta.mockResolvedValue({ data: [ROW], meta: { page: 1, pageSize: 10, total: 1 } });
  mocks.apiFetch.mockResolvedValue(DETAIL);
});

test('渲染只读列表并可查看详情', async () => {
  renderManager();

  expect(await screen.findByText('北欧沙发')).toBeInTheDocument();
  expect(screen.getByText('已发布')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '编辑' })).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '查看' }));
  expect(await screen.findByText('P1001-A')).toBeInTheDocument();
  expect(screen.getByText('2599.00')).toBeInTheDocument();
});
