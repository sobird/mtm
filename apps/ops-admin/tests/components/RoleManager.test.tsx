import type { Locale } from '@mtm/i18n';
import { PermissionProvider, ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { renderWithIntl } from '../i18n/render';

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/system/roles',
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: mocks.apiFetch,
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

import { RoleManager } from '@/components/system/RoleManager';

const PERMISSIONS = [
  { code: 'product:view', name: '商品查看', type: 'MENU', path: '/products', sort: 10 },
  { code: 'product:audit', name: '商品审核', type: 'MENU', path: '/audits', sort: 20 },
  { code: 'category:view', name: '类目查看', type: 'MENU', path: '/categories', sort: 30 },
  { code: 'category:manage', name: '类目管理', type: 'BUTTON', path: null, sort: 31 },
  { code: 'brand:manage', name: '品牌管理', type: 'MENU', path: '/brands', sort: 40 },
  { code: 'merchant:view', name: '商家查看', type: 'MENU', path: '/merchants', sort: 50 },
  { code: 'shop:view', name: '店铺查看', type: 'BUTTON', path: null, sort: 51 },
  { code: 'account:manage', name: '账号管理', type: 'MENU', path: '/system/accounts', sort: 60 },
  { code: 'role:manage', name: '角色管理', type: 'MENU', path: '/system/roles', sort: 61 },
  { code: 'platform:cross-tenant', name: '跨商家访问', type: 'API', path: null, sort: 90 },
];

const ROLE = {
  id: 'ops-role-super-admin',
  code: 'super-admin',
  name: '超级管理员',
  permissions: ['product:view'],
  merchantScope: [],
  accountCount: 1,
};

function renderManager(locale: Locale = 'zh-CN') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return renderWithIntl(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider permissions={[]}>
          <RoleManager />
        </PermissionProvider>
      </ToastProvider>
    </QueryClientProvider>,
    locale
  );
}

afterEach(cleanup);

beforeEach(() => {
  mocks.apiFetch.mockReset();
  mocks.apiFetch.mockImplementation((path: string, init?: { method?: string }) => {
    const method = init?.method ?? 'GET';

    if (path === '/api/roles' && method === 'GET') {
      return Promise.resolve([ROLE]);
    }

    if (path === '/api/permissions' && method === 'GET') {
      return Promise.resolve(PERMISSIONS);
    }

    if (path === '/api/roles' && method === 'POST') {
      return Promise.resolve(ROLE);
    }

    if (path.startsWith('/api/roles/') && method === 'PATCH') {
      return Promise.resolve(ROLE);
    }

    return Promise.resolve(null);
  });
});

test('renders every permission checkbox and creates a role with the selected codes', async () => {
  renderManager();

  expect(await screen.findByText('超级管理员')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '新建角色' }));

  const checkboxes = await screen.findAllByRole('checkbox');
  expect(checkboxes).toHaveLength(PERMISSIONS.length);

  await userEvent.type(screen.getByLabelText('角色编码'), 'ops-reviewer');
  await userEvent.type(screen.getByLabelText('角色名称'), '审核员');
  await userEvent.click(screen.getByLabelText('商品审核'));
  await userEvent.click(screen.getByRole('button', { name: '保存' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/roles', {
      method: 'POST',
      body: {
        code: 'ops-reviewer',
        name: '审核员',
        permissionCodes: ['product:audit'],
        merchantScope: [],
      },
    })
  );
});

test('renders role chrome and permission names from the message pack under en-US', async () => {
  renderManager('en-US');

  expect(await screen.findByText('Role management')).toBeInTheDocument();
  expect(await screen.findByText('超级管理员')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'New role' }));

  expect(await screen.findByLabelText('Product view')).toBeInTheDocument();
  expect(screen.getByLabelText('Product audit')).toBeInTheDocument();
});

test('edits a role and sends the updated permission codes', async () => {
  renderManager();

  expect(await screen.findByText('超级管理员')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '编辑' }));

  expect(screen.getByLabelText('商品查看')).toBeChecked();

  await userEvent.click(screen.getByLabelText('商品审核'));
  await userEvent.click(screen.getByRole('button', { name: '保存' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/roles/ops-role-super-admin', {
      method: 'PATCH',
      body: {
        name: '超级管理员',
        permissionCodes: ['product:view', 'product:audit'],
        merchantScope: [],
      },
    })
  );
});
