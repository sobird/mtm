import { PERMISSIONS } from '@mtm/contracts';
import { PermissionProvider, ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn(), apiFetchWithMeta: vi.fn(), push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn() }),
  usePathname: () => '/products/p1',
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: mocks.apiFetch,
  apiFetchWithMeta: mocks.apiFetchWithMeta,
  ApiError: class ApiError extends Error {
    readonly code = 'ERROR';
    readonly status = 500;
  },
}));

import { ProductForm } from '@/components/product/ProductForm';

const IMAGE = 'data:image/svg+xml;utf8,<svg/>';

const CATEGORIES = [
  {
    id: 'c1',
    parentId: null,
    name: '沙发',
    level: 1,
    path: 'c1',
    sort: 0,
    status: 'ACTIVE',
    attributes: [],
  },
];

function buildProduct(status: 'DRAFT' | 'REJECTED', latestAudit: unknown) {
  return {
    id: 'p1',
    code: 'P1001',
    title: '测试沙发',
    mainImageUrl: IMAGE,
    categoryId: 'c1',
    categoryName: '沙发',
    brandId: null,
    brandName: null,
    shopId: 's1',
    shopName: '旗舰店',
    merchantId: 'merchant-demo-1',
    merchantName: '青禾家居有限公司',
    status,
    version: 1,
    currentVersionId: 'v1',
    publishedVersionId: null,
    updatedAt: '2026-11-04T00:00:00.000Z',
    currentVersion: {
      id: 'v1',
      version: 1,
      status,
      title: '测试沙发',
      subtitle: null,
      mainImageUrl: IMAGE,
      images: [IMAGE],
      description: '描述',
      attributes: {},
      createdBy: 'account-1',
      createdAt: '2026-11-04T00:00:00.000Z',
      submittedAt: null,
      reviewedAt: null,
      publishedAt: null,
      skus: [{ id: 'sku-1', skuCode: 'P1001-1', specs: {}, price: '100.00', stock: 1, status: 'ACTIVE' }],
    },
    publishedVersion: null,
    versions: [
      {
        id: 'v1',
        version: 1,
        status,
        title: '测试沙发',
        createdAt: '2026-11-04T00:00:00.000Z',
        submittedAt: null,
        reviewedAt: null,
        publishedAt: null,
      },
    ],
    latestAudit,
  };
}

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider
          permissions={[PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.PRODUCT_SUBMIT]}
        >
          <ProductForm mode='edit' productId='p1' />
        </PermissionProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.apiFetch.mockImplementation((url: string) => {
    if (url === '/api/bff/categories/tree') {
      return Promise.resolve(CATEGORIES);
    }

    return Promise.resolve(buildProduct('DRAFT', null));
  });
  mocks.apiFetchWithMeta.mockResolvedValue({ data: [], meta: { page: 1, pageSize: 100, total: 0 } });
});

test('驳回商品展示驳回原因', async () => {
  mocks.apiFetch.mockImplementation((url: string) => {
    if (url === '/api/bff/categories/tree') {
      return Promise.resolve(CATEGORIES);
    }

    return Promise.resolve(
      buildProduct('REJECTED', { status: 'REJECTED', comment: '图片不清晰', reviewedAt: '2026-11-04T01:00:00.000Z' })
    );
  });

  renderForm();

  expect(await screen.findByText('驳回原因：图片不清晰')).toBeInTheDocument();
});

test('有未保存修改时禁用提交审核并提示先保存', async () => {
  renderForm();

  const submit = await screen.findByRole('button', { name: '提交审核' });
  expect(submit).toBeEnabled();

  const title = screen.getByLabelText('商品标题');
  await userEvent.clear(title);
  await userEvent.type(title, '新的标题');

  await waitFor(() => expect(screen.getByRole('button', { name: '提交审核' })).toBeDisabled());
  expect(screen.getByText('请先保存修改，再提交审核。')).toBeInTheDocument();
});
