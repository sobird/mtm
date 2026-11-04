import { PERMISSIONS } from '@mtm/contracts';
import type { Locale } from '@mtm/i18n';
import { PermissionProvider, ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { renderWithIntl } from '../i18n/render';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  apiFetchWithMeta: vi.fn(),
  signInWithCredentials: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/products',
}));

vi.mock('@/lib/auth-client', () => ({
  signInWithCredentials: mocks.signInWithCredentials,
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: mocks.apiFetch,
  apiFetchWithMeta: mocks.apiFetchWithMeta,
  ApiError: class ApiError extends Error {
    readonly code = 'ERROR';

    readonly status = 500;
  },
}));

import { LoginForm } from '@/components/auth/LoginForm';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProductForm } from '@/components/product/ProductForm';
import { ProductManager } from '@/components/product/ProductManager';

const IMAGE = 'data:image/svg+xml;utf8,<svg/>';

const PRODUCT = {
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
  status: 'DRAFT' as const,
  version: 1,
  currentVersionId: 'v1',
  publishedVersionId: null,
  updatedAt: '2026-11-04T00:00:00.000Z',
  currentVersion: {
    id: 'v1',
    version: 1,
    status: 'DRAFT' as const,
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
      status: 'DRAFT' as const,
      title: '测试沙发',
      createdAt: '2026-11-04T00:00:00.000Z',
      submittedAt: null,
      reviewedAt: null,
      publishedAt: null,
    },
  ],
  latestAudit: null,
};

const MENU_ITEM = {
  id: 'products',
  title: 'menu.product.group',
  icon: '',
  url: '/products',
  parentId: '',
  code: 'products',
  auth: true,
  index: 1,
  level: 1,
  sortId: 1,
  toolMenu: false,
  permissionCode: null,
};

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signInWithCredentials.mockResolvedValue({ error: undefined });
  mocks.apiFetchWithMeta.mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, total: 0 } });
  mocks.apiFetch.mockImplementation((url: string) => {
    if (url === '/api/bff/categories/tree') {
      return Promise.resolve([
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
      ]);
    }

    if (url === '/api/bff/products/p1') {
      return Promise.resolve(PRODUCT);
    }

    return Promise.resolve(null);
  });
});

function renderPage(ui: ReactElement, locale: Locale) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return renderWithIntl(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider permissions={Object.values(PERMISSIONS)}>{ui}</PermissionProvider>
      </ToastProvider>
    </QueryClientProvider>,
    locale
  );
}

test('login page renders in both locales', () => {
  renderPage(<LoginForm />, 'zh-CN');
  expect(screen.getByRole('tab', { name: '账号密码登录' })).toBeInTheDocument();

  cleanup();

  renderPage(<LoginForm />, 'en-US');
  expect(screen.getByRole('tab', { name: 'Sign in with password' })).toBeInTheDocument();
});

test('product list renders in both locales', async () => {
  renderPage(<ProductManager />, 'zh-CN');
  expect(await screen.findByText('商品列表')).toBeInTheDocument();

  cleanup();

  renderPage(<ProductManager />, 'en-US');
  expect(await screen.findByText('Products')).toBeInTheDocument();
});

test('product form renders in both locales', async () => {
  renderPage(<ProductForm mode='edit' productId='p1' />, 'zh-CN');
  expect(await screen.findByText('编辑商品')).toBeInTheDocument();

  cleanup();

  renderPage(<ProductForm mode='edit' productId='p1' />, 'en-US');
  expect(await screen.findByText('Edit product')).toBeInTheDocument();
});

// The portal-local Sidebar is the shell menu actually mounted by the merchant
// layout. It translates `menu.*` titles through `translateUiKey`; the generic
// `@mtm/ui` Sidebar does the same but does not own the merchant favorites UI.
test('shell menu renders translated fake menu items in both locales', () => {
  renderPage(<Sidebar menuItems={[MENU_ITEM]} favorites={[]} badges={[]} />, 'zh-CN');
  expect(screen.getByText('商品管理')).toBeInTheDocument();

  cleanup();

  renderPage(<Sidebar menuItems={[MENU_ITEM]} favorites={[]} badges={[]} />, 'en-US');
  expect(screen.getByText('Product management')).toBeInTheDocument();
});
