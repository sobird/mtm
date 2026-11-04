import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchMyMerchant: vi.fn(),
  updateMyShop: vi.fn(),
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/services/shop-profile', () => ({
  fetchMyMerchant: mocks.fetchMyMerchant,
  updateMyShop: mocks.updateMyShop,
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

// Keep this regression test focused on the form/save wiring.
vi.mock('@/components/shop/admin/AdminForm', () => ({
  default: () => null,
  AdminForm: () => null,
}));

vi.mock('@/components/shop/profile/ContactForm', () => ({
  default: () => null,
  ContactForm: () => null,
}));

vi.mock('@/components/admin/FieldMerchantLogo', () => ({
  default: () => null,
  FieldMerchantLogo: () => null,
}));

import { BaseInfo } from '@/components/shop/profile/BaseInfo';
import { ToastProvider } from '@/components/ui';

import { renderWithIntl } from '../i18n/render';

const LEGACY_DETAIL = {
  id: 148568,
  merchantManagerInfo: { email: 'legacy@example.com' },
  shopInfo: {
    id: 148568,
    name: '旧店铺',
    description: '旧简介',
    type: 10,
    category: 1,
    externalLink: 'https://legacy.example',
  },
};

const CORE_MERCHANT = {
  id: 'merchant-demo-1',
  shops: [
    {
      id: 'shop-demo-1',
      description: '核心简介',
      externalLink: 'https://core.example',
    },
  ],
};

function renderBaseInfo(locale: 'zh-CN' | 'en-US' = 'zh-CN') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return renderWithIntl(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BaseInfo />
      </ToastProvider>
    </QueryClientProvider>,
    locale
  );
}

afterEach(cleanup);

beforeEach(() => {
  mocks.fetchMyMerchant.mockReset();
  mocks.updateMyShop.mockReset();
  mocks.apiFetch.mockReset();

  mocks.fetchMyMerchant.mockResolvedValue(CORE_MERCHANT);
  mocks.updateMyShop.mockResolvedValue({ id: 'shop-demo-1' });
  mocks.apiFetch.mockImplementation((path: string) => {
    if (path === '/api/merchant/detail') {
      return Promise.resolve(LEGACY_DETAIL);
    }

    if (path === '/api/merchant/category') {
      return Promise.resolve([]);
    }

    return Promise.resolve(null);
  });
});

test('core-api 店铺加载失败时显示提示与重试，而不是禁用表单', async () => {
  mocks.fetchMyMerchant.mockRejectedValue(new Error('network down'));

  renderBaseInfo();

  expect(await screen.findByText('店铺信息加载失败')).toBeInTheDocument();
  expect(screen.queryByLabelText('店铺简介')).not.toBeInTheDocument();

  mocks.fetchMyMerchant.mockResolvedValue(CORE_MERCHANT);
  await userEvent.click(screen.getByRole('button', { name: '重试' }));

  const description = await screen.findByLabelText('店铺简介');
  await waitFor(() => expect(description).toHaveValue('核心简介'));
});

test('店铺简介默认值来自 core-api 店铺并保存到同一店铺', async () => {
  renderBaseInfo();

  // The legacy display card is intentionally kept.
  expect(await screen.findByText('旧店铺')).toBeInTheDocument();

  const description = await screen.findByLabelText('店铺简介');
  await waitFor(() => expect(description).toHaveValue('核心简介'));

  const externalLink = screen.getByLabelText('第三方平台店铺链接');
  expect(externalLink).toHaveValue('https://core.example');

  const submit = screen.getByRole('button', { name: '保存' });
  await waitFor(() => expect(submit).toBeEnabled());
  await userEvent.click(submit);

  await waitFor(() =>
    expect(mocks.updateMyShop).toHaveBeenCalledWith('shop-demo-1', {
      description: '核心简介',
      externalLink: 'https://core.example',
    })
  );
  expect(mocks.updateMyShop).not.toHaveBeenCalledWith(148568, expect.anything());
});

test('renders the shop base info form in English', async () => {
  renderBaseInfo('en-US');

  expect(await screen.findByText('Shop name')).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'Save' })).toBeInTheDocument();
});
