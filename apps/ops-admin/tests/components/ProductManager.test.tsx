import { PERMISSIONS } from '@mtm/contracts';
import type { Locale } from '@mtm/i18n';
import { PermissionProvider, ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { renderWithIntl } from '../i18n/render';

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

const CURRENT_VERSION = {
  id: 'v1',
  version: 1,
  status: 'PUBLISHED' as const,
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
};

const CATEGORY_TREE = [
  {
    id: 'c1',
    parentId: null,
    name: '沙发',
    level: 1,
    path: '/c1',
    sort: 0,
    status: 'ACTIVE' as const,
    attributes: [{ id: 'attr-1', name: '材质', type: 'SELECT' as const, required: false, options: ['棉麻'], sort: 0 }],
  },
];

const DETAIL = {
  ...ROW,
  currentVersion: CURRENT_VERSION,
  publishedVersion: CURRENT_VERSION,
  versions: [
    {
      id: 'v1',
      version: 1,
      status: 'PUBLISHED' as const,
      title: '北欧沙发历史',
      createdAt: ROW.updatedAt,
      submittedAt: ROW.updatedAt,
      reviewedAt: ROW.updatedAt,
      publishedAt: ROW.updatedAt,
    },
  ],
};

function renderManager(locale: Locale = 'zh-CN') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderWithIntl(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider permissions={Object.values(PERMISSIONS)}>
          <ProductManager />
        </PermissionProvider>
      </ToastProvider>
    </QueryClientProvider>,
    locale
  );
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.apiFetchWithMeta.mockResolvedValue({ data: [ROW], meta: { page: 1, pageSize: 10, total: 1 } });
  mocks.apiFetch.mockImplementation((path: string) => {
    if (path === '/api/bff/categories/tree') {
      return Promise.resolve(CATEGORY_TREE);
    }

    if (path === '/api/bff/products/p1') {
      return Promise.resolve(DETAIL);
    }

    return Promise.resolve(null);
  });
});

test('渲染只读列表并可查看完整详情（含属性名、线上版本与版本历史）', async () => {
  renderManager();

  expect(await screen.findByText('北欧沙发')).toBeInTheDocument();
  expect(screen.getByText('已发布')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '查看' }));

  // 当前版本与线上版本都展示 SKU。
  expect(await screen.findAllByText('P1001-A')).toHaveLength(2);
  expect(screen.getAllByText('2599.00')).toHaveLength(2);

  // 属性 id 解析为类目属性名，且不再显示原始 id（当前版本与线上版本各一处）。
  expect(await screen.findAllByText('材质')).toHaveLength(2);
  expect(screen.queryByText('attr-1')).not.toBeInTheDocument();

  expect(screen.getByText('线上版本')).toBeInTheDocument();
  expect(screen.queryByText('暂无线上版本')).not.toBeInTheDocument();

  expect(screen.getByText('版本历史')).toBeInTheDocument();
  expect(await screen.findByText('北欧沙发历史')).toBeInTheDocument();

  for (const name of ['编辑', '删除', '提交', '发布', '下线', '审核', '新建']) {
    expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
  }
});

test('提交筛选时传递 keyword 与 status 查询参数', async () => {
  renderManager();

  await screen.findByText('北欧沙发');

  await userEvent.type(screen.getByLabelText('关键字'), '沙发');
  await userEvent.click(screen.getByLabelText('商品状态筛选'));
  await userEvent.click(await screen.findByRole('option', { name: '已发布' }));
  await userEvent.click(screen.getByRole('button', { name: '查询' }));

  await waitFor(() =>
    expect(mocks.apiFetchWithMeta).toHaveBeenLastCalledWith('/api/bff/products', {
      query: { page: 1, pageSize: 10, keyword: '沙发', status: 'PUBLISHED' },
    })
  );
});

test('翻页时传递新的 page 并保持 pageSize 为 10', async () => {
  mocks.apiFetchWithMeta.mockResolvedValue({ data: [ROW], meta: { page: 1, pageSize: 10, total: 15 } });
  renderManager();

  await screen.findByText('北欧沙发');

  await userEvent.click(screen.getByTitle('2'));

  await waitFor(() =>
    expect(mocks.apiFetchWithMeta).toHaveBeenLastCalledWith('/api/bff/products', {
      query: { page: 2, pageSize: 10, keyword: undefined, status: undefined },
    })
  );
});

test('列表加载失败显示错误态', async () => {
  mocks.apiFetchWithMeta.mockRejectedValue(new Error('boom'));

  renderManager();

  expect(await screen.findByText('加载失败')).toBeInTheDocument();
});

test('列表为空显示空态', async () => {
  mocks.apiFetchWithMeta.mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, total: 0 } });

  renderManager();

  expect(await screen.findByText('暂无商品')).toBeInTheDocument();
});

test('renders the product list in English', async () => {
  renderManager('en-US');

  expect(await screen.findByText('Product management')).toBeInTheDocument();
  expect(await screen.findByText('Published')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
});

test('empty version description falls back to the no-description copy in English', async () => {
  mocks.apiFetch.mockImplementation((path: string) => {
    if (path === '/api/bff/categories/tree') {
      return Promise.resolve(CATEGORY_TREE);
    }

    if (path === '/api/bff/products/p1') {
      return Promise.resolve({
        ...DETAIL,
        currentVersion: { ...CURRENT_VERSION, description: '' },
        publishedVersion: { ...CURRENT_VERSION, description: '' },
      });
    }

    return Promise.resolve(null);
  });

  renderManager('en-US');

  await userEvent.click(await screen.findByRole('button', { name: 'View' }));

  expect(await screen.findAllByText('No description')).toHaveLength(2);
});
