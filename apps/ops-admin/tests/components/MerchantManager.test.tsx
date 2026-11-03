import { PERMISSIONS } from '@mtm/contracts';
import { PermissionProvider, ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn(), apiFetchWithMeta: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/merchants',
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: mocks.apiFetch,
  apiFetchWithMeta: mocks.apiFetchWithMeta,
  ApiError: class ApiError extends Error {
    readonly code: string;

    readonly status: number;

    constructor(code: string, status: number, message = code) {
      super(message);
      this.name = 'ApiError';
      this.code = code;
      this.status = status;
    }
  },
}));

import { MerchantManager } from '@/components/catalog/MerchantManager';

const MERCHANT = {
  id: 'merchant-demo-1',
  code: 'M1001',
  name: '青禾家居有限公司',
  status: 'ACTIVE' as const,
  contactName: '张三',
  contactPhone: '13800000000',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const MERCHANT_DETAIL = {
  ...MERCHANT,
  shops: [
    {
      id: 'shop-demo-1',
      merchantId: 'merchant-demo-1',
      name: '青禾家居旗舰店',
      logoUrl: null,
      status: 'ACTIVE' as const,
      description: null,
      externalLink: null,
      address: '杭州市西湖区',
      contactName: '张三',
      contactPhone: '13800000000',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'shop-demo-2',
      merchantId: 'merchant-demo-1',
      name: '青禾生活馆',
      logoUrl: null,
      status: 'ACTIVE' as const,
      description: null,
      externalLink: null,
      address: '杭州市余杭区',
      contactName: '李四',
      contactPhone: '13900000000',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
};

function renderManager() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider permissions={[PERMISSIONS.MERCHANT_VIEW]}>
          <MerchantManager />
        </PermissionProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

afterEach(cleanup);

beforeEach(() => {
  mocks.apiFetch.mockReset();
  mocks.apiFetchWithMeta.mockReset();
  mocks.apiFetchWithMeta.mockResolvedValue({
    data: [MERCHANT],
    meta: { page: 1, pageSize: 10, total: 1 },
  });
  mocks.apiFetch.mockImplementation((path: string) => {
    if (path === '/api/bff/merchants/merchant-demo-1') {
      return Promise.resolve(MERCHANT_DETAIL);
    }

    return Promise.resolve(null);
  });
});

test('渲染商家列表并打开只读详情', async () => {
  renderManager();
  expect(await screen.findByText('青禾家居有限公司')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '查看' }));

  expect(await screen.findByText('青禾家居旗舰店')).toBeInTheDocument();
  expect(screen.getByText('M1001')).toBeInTheDocument();
  expect(screen.getByText('青禾生活馆')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '新建商家' })).not.toBeInTheDocument();
});
