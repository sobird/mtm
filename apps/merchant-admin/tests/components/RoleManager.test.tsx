import { PERMISSIONS } from '@mtm/contracts';
import { PermissionProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

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
import { ToastProvider } from '@/components/ui';

const MERCHANT_PERMISSIONS = [
  { code: 'product:view', name: '商品查看', type: 'MENU', path: '/products', sort: 10 },
  { code: 'product:create', name: '商品创建', type: 'BUTTON', path: null, sort: 20 },
  { code: 'product:update', name: '商品编辑', type: 'BUTTON', path: null, sort: 30 },
  { code: 'account:manage', name: '账号管理', type: 'MENU', path: '/system/accounts', sort: 90 },
  { code: 'role:manage', name: '角色管理', type: 'MENU', path: '/system/roles', sort: 100 },
];

const ROLE = {
  id: 'merchant-role-staff',
  code: 'staff',
  name: '店员角色',
  permissions: ['product:view'],
  accountCount: 1,
};

function renderManager(permissions: string[] = [PERMISSIONS.ROLE_MANAGE]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider permissions={permissions}>
          <RoleManager />
        </PermissionProvider>
      </ToastProvider>
    </QueryClientProvider>
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
      return Promise.resolve(MERCHANT_PERMISSIONS);
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

test('explains that the owner always has every permission', async () => {
  renderManager();

  expect(screen.getByRole('heading', { name: '角色管理' })).toBeInTheDocument();
  expect(await screen.findByText('店员角色')).toBeInTheDocument();
  expect(screen.getByText('子账号按角色获得权限，主账号始终拥有全部权限')).toBeInTheDocument();
});

test('renders every permission checkbox and creates a role with the selected codes', async () => {
  renderManager();

  expect(await screen.findByText('店员角色')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '新建角色' }));

  const checkboxes = await screen.findAllByRole('checkbox');
  expect(checkboxes).toHaveLength(MERCHANT_PERMISSIONS.length);

  await userEvent.type(screen.getByLabelText('角色编码'), 'reviewer');
  await userEvent.type(screen.getByLabelText('角色名称'), '审核员');
  await userEvent.click(screen.getByLabelText('商品创建'));
  await userEvent.click(screen.getByRole('button', { name: '保存' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/roles', {
      method: 'POST',
      body: {
        code: 'reviewer',
        name: '审核员',
        permissionCodes: ['product:create'],
      },
    })
  );
});

test('edits a role without sending the immutable code', async () => {
  renderManager();

  expect(await screen.findByText('店员角色')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '编辑' }));

  expect(screen.queryByLabelText('角色编码')).not.toBeInTheDocument();
  expect(screen.getByLabelText('商品查看')).toBeChecked();

  await userEvent.click(screen.getByLabelText('商品创建'));
  await userEvent.click(screen.getByRole('button', { name: '保存' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/roles/merchant-role-staff', {
      method: 'PATCH',
      body: {
        name: '店员角色',
        permissionCodes: ['product:view', 'product:create'],
      },
    })
  );
});

test('hides the create button without the role permission', async () => {
  renderManager([]);

  expect(await screen.findByText('店员角色')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '新建角色' })).not.toBeInTheDocument();
});
