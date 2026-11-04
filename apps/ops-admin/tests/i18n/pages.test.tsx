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
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
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
import { AuditManager } from '@/components/catalog/AuditManager';
import { ProductManager } from '@/components/catalog/ProductManager';

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signInWithCredentials.mockResolvedValue({ error: undefined });
  mocks.apiFetch.mockResolvedValue(null);
  mocks.apiFetchWithMeta.mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, total: 0 } });
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
  expect(screen.getByText('运营后台登录')).toBeInTheDocument();

  cleanup();

  renderPage(<LoginForm />, 'en-US');
  expect(screen.getByText('Ops admin sign in')).toBeInTheDocument();
});

test('audit page renders in both locales', async () => {
  renderPage(<AuditManager />, 'zh-CN');
  expect(await screen.findByText('商品审核')).toBeInTheDocument();

  cleanup();

  renderPage(<AuditManager />, 'en-US');
  expect(await screen.findByText('Product review')).toBeInTheDocument();
});

test('product page renders in both locales', async () => {
  renderPage(<ProductManager />, 'zh-CN');
  expect(await screen.findByText('商品管理')).toBeInTheDocument();

  cleanup();

  renderPage(<ProductManager />, 'en-US');
  expect(await screen.findByText('Product management')).toBeInTheDocument();
});
