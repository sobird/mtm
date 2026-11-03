import { PERMISSIONS } from '@mtm/contracts';
import { PermissionProvider, ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn(), apiFetchWithMeta: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/brands',
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

import { BrandManager } from '@/components/catalog/BrandManager';

const BRAND = { id: 'brand-demo-1', name: '青禾', logoUrl: null, status: 'ACTIVE' as const };

function renderManager() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider permissions={[PERMISSIONS.BRAND_MANAGE]}>
          <BrandManager />
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
    data: [BRAND],
    meta: { page: 1, pageSize: 10, total: 1 },
  });
  mocks.apiFetch.mockImplementation((path: string, init?: { method?: string }) => {
    if (path === '/api/bff/brands' && init?.method === 'POST') {
      return Promise.resolve(BRAND);
    }

    if (path.startsWith('/api/bff/brands/') && init?.method === 'PATCH') {
      return Promise.resolve(BRAND);
    }

    return Promise.resolve(null);
  });
});

test('渲染品牌列表并创建品牌', async () => {
  renderManager();
  expect(await screen.findByText('青禾')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '新建品牌' }));
  await userEvent.type(screen.getByLabelText('品牌名称'), '新品牌');
  await userEvent.click(screen.getByRole('button', { name: '保存' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/bff/brands', {
      method: 'POST',
      body: { name: '新品牌', status: 'ACTIVE', logoUrl: null },
    })
  );
});

test('停用品牌走 PATCH', async () => {
  renderManager();

  await userEvent.click(await screen.findByRole('button', { name: '停用' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/bff/brands/brand-demo-1', {
      method: 'PATCH',
      body: { status: 'DISABLED' },
    })
  );
});
