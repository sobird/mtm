import { PERMISSIONS } from '@mtm/contracts';
import { PermissionProvider, ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/categories',
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

import { CategoryManager } from '@/components/catalog/CategoryManager';

const TREE = [
  {
    id: 'c1',
    parentId: null,
    name: '家居生活',
    level: 1,
    path: '/c1',
    sort: 0,
    status: 'ACTIVE',
    attributes: [],
  },
  {
    id: 'c2',
    parentId: 'c1',
    name: '家具',
    level: 2,
    path: '/c1/c2',
    sort: 0,
    status: 'ACTIVE',
    attributes: [],
  },
  {
    id: 'c3',
    parentId: 'c2',
    name: '沙发',
    level: 3,
    path: '/c1/c2/c3',
    sort: 0,
    status: 'DISABLED',
    attributes: [{ name: '材质', type: 'TEXT', required: false, options: [], sort: 0 }],
  },
];

function renderManager(permissions: string[] = [PERMISSIONS.CATEGORY_MANAGE]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <PermissionProvider permissions={permissions}>
          <CategoryManager />
        </PermissionProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

afterEach(cleanup);

beforeEach(() => {
  mocks.apiFetch.mockReset();
  mocks.apiFetch.mockImplementation((path: string, init?: { method?: string }) => {
    if (path === '/api/bff/categories/tree' && (init?.method ?? 'GET') === 'GET') {
      return Promise.resolve(TREE);
    }

    if (path === '/api/bff/categories' && init?.method === 'POST') {
      return Promise.resolve({});
    }

    if (path.startsWith('/api/bff/categories/') && init?.method === 'PATCH') {
      return Promise.resolve({});
    }

    if (path.startsWith('/api/bff/categories/') && init?.method === 'DELETE') {
      return Promise.resolve(null);
    }

    return Promise.resolve([]);
  });
});

test('空类目树显示空状态并允许创建一级类目', async () => {
  mocks.apiFetch.mockResolvedValue([]);
  renderManager();
  expect(await screen.findByText('暂无类目')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '新建一级类目' })).toBeInTheDocument();
});

test('按层级缩进渲染类目并创建子类目', async () => {
  mocks.apiFetch.mockImplementation((path: string, init?: { method?: string }) => {
    if (path === '/api/bff/categories/tree' && (init?.method ?? 'GET') === 'GET') {
      return Promise.resolve([
        {
          id: 'c1',
          parentId: null,
          name: '家居生活',
          level: 1,
          path: '/c1',
          sort: 0,
          status: 'ACTIVE',
          attributes: [],
        },
        { id: 'c2', parentId: 'c1', name: '家具', level: 2, path: '/c1/c2', sort: 0, status: 'ACTIVE', attributes: [] },
      ]);
    }
    if (path === '/api/bff/categories' && init?.method === 'POST') return Promise.resolve({});
    return Promise.resolve([]);
  });
  renderManager();

  expect(await screen.findByText('家居生活')).toBeInTheDocument();
  expect(screen.getByText('家具')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '新建一级类目' }));
  await userEvent.type(screen.getByLabelText('类目名称'), '数码电器');
  await userEvent.click(screen.getByRole('button', { name: '保存' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/bff/categories', {
      method: 'POST',
      body: { name: '数码电器', sort: 0, status: 'ACTIVE' },
    })
  );
});

test('为父类目添加子类目时携带 parentId', async () => {
  renderManager();

  expect(await screen.findByText('家居生活')).toBeInTheDocument();

  await userEvent.click(screen.getAllByRole('button', { name: '添加子类' })[0]);
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText('所属父类目')).toBeInTheDocument();
  expect(within(dialog).getByText('家居生活')).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText('类目名称'), '卧室家具');
  await userEvent.click(screen.getByRole('button', { name: '保存' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/bff/categories', {
      method: 'POST',
      body: { parentId: 'c1', name: '卧室家具', sort: 0, status: 'ACTIVE' },
    })
  );
});

test('三级类目不提供添加子类入口', async () => {
  renderManager();

  expect(await screen.findByText('沙发')).toBeInTheDocument();

  await waitFor(() => expect(screen.getAllByRole('button', { name: '编辑' })).toHaveLength(3));
  expect(screen.getAllByRole('button', { name: '添加子类' })).toHaveLength(2);
});

test('编辑类目时回填数据并提交更新', async () => {
  renderManager();

  expect(await screen.findByText('家居生活')).toBeInTheDocument();

  await userEvent.click(screen.getAllByRole('button', { name: '编辑' })[0]);

  expect(screen.getByLabelText('类目名称')).toHaveValue('家居生活');
  expect(screen.getByText('一级类目')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: '保存' }));

  await waitFor(() =>
    expect(mocks.apiFetch).toHaveBeenCalledWith('/api/bff/categories/c1', {
      method: 'PATCH',
      body: { name: '家居生活', sort: 0, status: 'ACTIVE', attributes: [] },
    })
  );
});

test('删除类目需要确认', async () => {
  renderManager();

  expect(await screen.findByText('家居生活')).toBeInTheDocument();

  await userEvent.click(screen.getAllByRole('button', { name: '删除' })[0]);
  await userEvent.click(screen.getByRole('button', { name: '确认删除' }));

  await waitFor(() => expect(mocks.apiFetch).toHaveBeenCalledWith('/api/bff/categories/c1', { method: 'DELETE' }));
});

test('没有管理权限时不显示操作入口', async () => {
  renderManager([PERMISSIONS.CATEGORY_VIEW]);

  expect(await screen.findByText('家居生活')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '新建一级类目' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '编辑' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '删除' })).not.toBeInTheDocument();
});
