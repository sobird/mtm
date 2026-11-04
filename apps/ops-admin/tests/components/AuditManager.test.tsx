import { PERMISSIONS } from '@mtm/contracts';
import { PermissionProvider, ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ apiFetchWithMeta: vi.fn(), apiFetch: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/audits',
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: mocks.apiFetch,
  apiFetchWithMeta: mocks.apiFetchWithMeta,
  ApiError: class ApiError extends Error {
    readonly code = 'ERROR';
    readonly status = 500;
  },
}));

import { AuditManager } from '@/components/catalog/AuditManager';

const AUDIT = {
  id: 'a1',
  productVersionId: 'v1',
  status: 'PENDING' as const,
  submitterId: 'm1',
  reviewerId: null,
  comment: null,
  submittedAt: '2026-11-04T09:00:00.000Z',
  reviewedAt: null,
  product: {
    id: 'p1',
    code: 'P1002',
    title: '星河手机',
    mainImageUrl: 'data:image/svg+xml;utf8,<svg/>',
    version: 1,
    merchantId: 'merchant-demo-1',
    merchantName: '青禾家居有限公司',
    shopName: '旗舰店',
    categoryName: '智能手机',
  },
};

function renderManager() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider permissions={Object.values(PERMISSIONS)}>
          <AuditManager />
        </PermissionProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.apiFetchWithMeta.mockResolvedValue({ data: [AUDIT], meta: { page: 1, pageSize: 10, total: 1 } });
  mocks.apiFetch.mockResolvedValue({});
});

test('审核通过调用 approve 端点', async () => {
  renderManager();

  expect(await screen.findByText('星河手机')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: '审核' }));
  await userEvent.click(screen.getByRole('button', { name: '通过' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/bff/audits/a1/approve', {
      method: 'POST',
      body: { comment: undefined },
    })
  );
});

test('驳回必须填写原因', async () => {
  renderManager();

  await userEvent.click(await screen.findByRole('button', { name: '审核' }));
  await userEvent.click(screen.getByRole('button', { name: '驳回' }));

  expect(mocks.apiFetch).not.toHaveBeenCalledWith('/api/bff/audits/a1/reject', expect.anything());
  expect(await screen.findByText('请填写驳回原因')).toBeInTheDocument();
});
