import { PERMISSIONS } from '@mtm/contracts';
import type { AuditRecordDTO } from '@mtm/contracts';
import type { Locale } from '@mtm/i18n';
import { PermissionProvider, ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { renderWithIntl } from '../i18n/render';

const mocks = vi.hoisted(() => {
  class MockApiError extends Error {
    readonly code: string;

    readonly status: number;

    constructor(code: string, status: number, message = code) {
      super(message);
      this.name = 'ApiError';
      this.code = code;
      this.status = status;
    }
  }

  return { apiFetchWithMeta: vi.fn(), apiFetch: vi.fn(), MockApiError };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/audits',
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: mocks.apiFetch,
  apiFetchWithMeta: mocks.apiFetchWithMeta,
  ApiError: mocks.MockApiError,
}));

import { AuditManager } from '@/components/catalog/AuditManager';

const AUDIT: AuditRecordDTO = {
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

const VERSION_SNAPSHOT = {
  id: 'v1',
  version: 1,
  status: 'SUBMITTED',
  title: '星河手机',
  subtitle: null,
  mainImageUrl: 'data:image/svg+xml;utf8,<svg/>',
  images: ['data:image/svg+xml;utf8,<svg/>'],
  description: '轻旗舰手机',
  attributes: {},
  createdBy: 'merchant-demo-1',
  createdAt: '2026-11-04T08:00:00.000Z',
  submittedAt: '2026-11-04T09:00:00.000Z',
  reviewedAt: null,
  publishedAt: null,
  skus: [
    {
      id: 'sku1',
      skuCode: 'SKU-001',
      specs: { 颜色: '曜石黑' },
      price: '3999.00',
      stock: 10,
      status: 'ACTIVE',
    },
  ],
};

function renderManager(locale: Locale = 'zh-CN') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderWithIntl(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider permissions={Object.values(PERMISSIONS)}>
          <AuditManager />
        </PermissionProvider>
      </ToastProvider>
    </QueryClientProvider>,
    locale
  );
}

function mockList(record: AuditRecordDTO) {
  mocks.apiFetchWithMeta.mockResolvedValue({ data: [record], meta: { page: 1, pageSize: 10, total: 1 } });
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mockList(AUDIT);
  mocks.apiFetch.mockResolvedValue({});
});

test('默认按 status=PENDING 请求审核列表', async () => {
  renderManager();

  await screen.findByText('星河手机');

  expect(mocks.apiFetchWithMeta).toHaveBeenCalledWith('/api/bff/audits', {
    query: { page: 1, pageSize: 10, status: 'PENDING', keyword: undefined },
  });
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

test('纯空白的驳回原因同样提示必填', async () => {
  renderManager();

  await userEvent.click(await screen.findByRole('button', { name: '审核' }));
  await userEvent.type(screen.getByLabelText('审核备注'), '   ');
  await userEvent.click(screen.getByRole('button', { name: '驳回' }));

  expect(mocks.apiFetch).not.toHaveBeenCalledWith('/api/bff/audits/a1/reject', expect.anything());
  expect(await screen.findByText('请填写驳回原因')).toBeInTheDocument();
});

test('有效驳回发送 trim 后的原因并在成功后关闭、刷新', async () => {
  renderManager();

  await userEvent.click(await screen.findByRole('button', { name: '审核' }));
  await userEvent.type(screen.getByLabelText('审核备注'), '  描述与实物不符  ');
  await userEvent.click(screen.getByRole('button', { name: '驳回' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/bff/audits/a1/reject', {
      method: 'POST',
      body: { comment: '描述与实物不符' },
    })
  );

  expect(await screen.findByText('商品已驳回')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(mocks.apiFetchWithMeta).toHaveBeenCalledTimes(2));
});

test('决策 409 时展示翻译后的错误并刷新列表', async () => {
  mocks.apiFetch.mockImplementation((path: string) => {
    if (path === '/api/bff/audits/a1/reject') {
      return Promise.reject(new mocks.MockApiError('AUDIT_ALREADY_REVIEWED', 409, '该审核已被其他审核员处理'));
    }

    return Promise.resolve({});
  });

  renderManager();

  await userEvent.click(await screen.findByRole('button', { name: '审核' }));
  await userEvent.type(screen.getByLabelText('审核备注'), '描述不符');
  await userEvent.click(screen.getByRole('button', { name: '驳回' }));

  expect(await screen.findByText('该审核已处理')).toBeInTheDocument();
  await waitFor(() => expect(mocks.apiFetchWithMeta).toHaveBeenCalledTimes(2));
});

test('决策请求未结束时锁定两个按钮且禁止关闭对话框', async () => {
  mocks.apiFetch.mockImplementation((path: string) => {
    if (path === '/api/bff/audits/a1/approve') {
      return new Promise(() => {});
    }

    return Promise.resolve({});
  });

  renderManager();

  await userEvent.click(await screen.findByRole('button', { name: '审核' }));
  await userEvent.click(screen.getByRole('button', { name: '通过' }));

  await waitFor(() => expect(screen.getByRole('button', { name: '通过' })).toBeDisabled());
  expect(screen.getByRole('button', { name: '驳回' })).toBeDisabled();

  await userEvent.click(screen.getByRole('button', { name: '关闭' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('非 PENDING 记录不显示通过/驳回按钮', async () => {
  mockList({ ...AUDIT, status: 'REJECTED' });

  renderManager();

  await userEvent.click(await screen.findByRole('button', { name: '查看' }));

  expect(screen.queryByRole('button', { name: '通过' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '驳回' })).not.toBeInTheDocument();
});

test('版本快照无法匹配时提示不可用且不回退其他版本', async () => {
  mocks.apiFetch.mockImplementation((path: string) => {
    if (path === '/api/bff/products/p1') {
      return Promise.resolve({ currentVersion: { id: 'v2' }, publishedVersion: null });
    }

    return Promise.resolve([]);
  });

  renderManager();

  await userEvent.click(await screen.findByRole('button', { name: '审核' }));

  expect(await screen.findByText('该审核版本的快照不可用')).toBeInTheDocument();
});

test('renders the review dialog in English', async () => {
  renderManager('en-US');

  expect(await screen.findByText('Product review')).toBeInTheDocument();
  await userEvent.click(await screen.findByRole('button', { name: 'Review' }));

  expect(screen.getByTestId('audit-comment')).toBeInTheDocument();
  expect(screen.getByTestId('audit-approve')).toHaveTextContent('Approve');
  expect(screen.getByTestId('audit-reject')).toHaveTextContent('Reject');

  await userEvent.click(screen.getByTestId('audit-reject'));
  expect(await screen.findByText('Please provide a rejection reason.')).toBeInTheDocument();
});

test('matched version snapshot renders the SKU section in English', async () => {
  mocks.apiFetch.mockImplementation((path: string) => {
    if (path === '/api/bff/products/p1') {
      return Promise.resolve({ currentVersion: VERSION_SNAPSHOT, publishedVersion: null });
    }

    if (path === '/api/bff/categories/tree') {
      return Promise.resolve([]);
    }

    return Promise.resolve({});
  });

  renderManager('en-US');

  await userEvent.click(await screen.findByRole('button', { name: 'Review' }));

  expect(await screen.findByRole('heading', { name: 'SKU' })).toBeInTheDocument();
  expect(await screen.findByText('SKU-001')).toBeInTheDocument();
});
