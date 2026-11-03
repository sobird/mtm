import { PermissionProvider, ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
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

const ACCOUNT = {
  id: 'ops-account-demo',
  username: 'admin',
  name: '运营管理员',
  status: 'ACTIVE' as const,
  roles: [{ id: 'ops-role-super-admin', code: 'super-admin', name: '超级管理员' }],
  lastLoginAt: '2026-11-03T09:00:00.000Z',
  createdAt: '2026-11-01T09:00:00.000Z',
};

const ROLES = [
  {
    id: 'ops-role-super-admin',
    code: 'super-admin',
    name: '超级管理员',
    permissions: [],
    merchantScope: [],
    accountCount: 1,
  },
];

function renderManager() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider permissions={[]}>
          <AccountManager currentAccountId='ops-account-demo' />
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
      return Promise.resolve({ items: [ACCOUNT], total: 1 });
    }

    if (path === '/api/roles' && method === 'GET') {
      return Promise.resolve(ROLES);
    }

    if (path === '/api/accounts' && method === 'POST') {
      return Promise.resolve(ACCOUNT);
    }

    return Promise.resolve(null);
  });
});

test('renders the account list and creates an account', async () => {
  renderManager();

  expect(await screen.findByText('admin')).toBeInTheDocument();

  const createButton = screen.getByRole('button', { name: '新建账号' });
  expect(createButton).toBeInTheDocument();

  await userEvent.click(createButton);
  await userEvent.type(screen.getByLabelText('用户名'), 'newuser');
  await userEvent.type(screen.getByLabelText('姓名'), '新用户');
  await userEvent.type(screen.getByLabelText('密码'), 'password123');
  await userEvent.click(screen.getByRole('button', { name: '保存' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/accounts', {
      method: 'POST',
      body: {
        username: 'newuser',
        name: '新用户',
        password: 'password123',
        roleIds: [],
      },
    })
  );
});
