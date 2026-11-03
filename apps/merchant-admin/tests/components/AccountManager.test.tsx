import { PERMISSIONS } from '@mtm/contracts';
import { PermissionProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/system/accounts',
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

import { AccountManager } from '@/components/system/AccountManager';
import { ToastProvider } from '@/components/ui';

const OWNER_ACCOUNT = {
  id: 'merchant-account-owner',
  username: 'shop-owner',
  name: '主账号',
  phone: null,
  interCode: 'M1001',
  isOwner: true,
  status: 'ACTIVE' as const,
  roles: [{ id: 'merchant-role-owner', code: 'owner', name: '主账号角色' }],
  lastLoginAt: '2026-11-03T09:00:00.000Z',
  createdAt: '2026-11-01T09:00:00.000Z',
};

const ACTIVE_STAFF = {
  id: 'merchant-account-staff-a',
  username: 'staff-a',
  name: '店员甲',
  phone: '13800000001',
  interCode: 'M1001',
  isOwner: false,
  status: 'ACTIVE' as const,
  roles: [{ id: 'merchant-role-staff', code: 'staff', name: '店员角色' }],
  lastLoginAt: null,
  createdAt: '2026-11-02T09:00:00.000Z',
};

const DISABLED_STAFF = {
  id: 'merchant-account-staff-b',
  username: 'staff-b',
  name: '店员乙',
  phone: '13800000002',
  interCode: 'M1001',
  isOwner: false,
  status: 'DISABLED' as const,
  roles: [],
  lastLoginAt: null,
  createdAt: '2026-11-02T10:00:00.000Z',
};

const ROLES = [
  {
    id: 'merchant-role-staff',
    code: 'staff',
    name: '店员角色',
    permissions: ['product:view'],
    accountCount: 1,
  },
];

function renderManager(permissions: string[] = [PERMISSIONS.ACCOUNT_MANAGE]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider permissions={permissions}>
          <AccountManager />
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

    if (path === '/api/accounts' && method === 'GET') {
      return Promise.resolve({ items: [OWNER_ACCOUNT, ACTIVE_STAFF, DISABLED_STAFF], total: 3 });
    }

    if (path === '/api/roles' && method === 'GET') {
      return Promise.resolve(ROLES);
    }

    if (path === '/api/accounts' && method === 'POST') {
      return Promise.resolve(ACTIVE_STAFF);
    }

    if (path.startsWith('/api/accounts/') && method === 'PATCH') {
      return Promise.resolve(ACTIVE_STAFF);
    }

    return Promise.resolve(null);
  });
});

function rowOf(username: string) {
  const cell = screen.getByText(username);
  const row = cell.closest('tr');

  if (!row) {
    throw new Error(`Row for ${username} was not found`);
  }

  return within(row);
}

test('renders the sub-account list and creates a sub-account with selected roles', async () => {
  renderManager();

  expect(screen.getByRole('heading', { name: '子账号管理' })).toBeInTheDocument();
  expect(await screen.findByText('staff-a')).toBeInTheDocument();
  expect(screen.getByText('13800000001')).toBeInTheDocument();

  const createButton = screen.getByRole('button', { name: '新建账号' });
  expect(createButton).toBeInTheDocument();

  await userEvent.click(createButton);
  await userEvent.type(screen.getByLabelText('用户名'), 'staff-c');
  await userEvent.type(screen.getByLabelText('姓名'), '店员丙');
  await userEvent.type(screen.getByLabelText('密码'), 'password123');
  await userEvent.click(screen.getByLabelText('店员角色'));
  await userEvent.click(screen.getByRole('button', { name: '保存' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/accounts', {
      method: 'POST',
      body: {
        username: 'staff-c',
        name: '店员丙',
        password: 'password123',
        roleIds: ['merchant-role-staff'],
      },
    })
  );
});

test('disables and enables sub-accounts with PATCH', async () => {
  renderManager();

  expect(await screen.findByText('staff-a')).toBeInTheDocument();

  await userEvent.click(rowOf('staff-a').getByRole('button', { name: '停用' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/accounts/merchant-account-staff-a', {
      method: 'PATCH',
      body: { status: 'DISABLED' },
    })
  );

  await userEvent.click(rowOf('staff-b').getByRole('button', { name: '启用' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/accounts/merchant-account-staff-b', {
      method: 'PATCH',
      body: { status: 'ACTIVE' },
    })
  );
});

test('resets a sub-account password', async () => {
  renderManager();

  expect(await screen.findByText('staff-a')).toBeInTheDocument();

  await userEvent.click(rowOf('staff-a').getByRole('button', { name: '重置密码' }));
  await userEvent.type(screen.getByLabelText('新密码'), 'newpassword123');
  await userEvent.click(screen.getByRole('button', { name: '保存' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/accounts/merchant-account-staff-a/password', {
      method: 'POST',
      body: { password: 'newpassword123' },
    })
  );
});

test('hides the create button without the account permission', async () => {
  renderManager([]);

  expect(await screen.findByText('staff-a')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '新建账号' })).not.toBeInTheDocument();
});
