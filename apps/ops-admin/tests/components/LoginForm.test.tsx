import type { Locale } from '@mtm/i18n';
import { ToastProvider } from '@mtm/ui';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { renderWithIntl } from '../i18n/render';

const replace = vi.fn();
const signInWithCredentials = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

vi.mock('@/lib/auth-client', () => ({
  signInWithCredentials: (...args: unknown[]) => signInWithCredentials(...args),
}));

import { LoginForm } from '@/components/auth/LoginForm';

afterEach(cleanup);

beforeEach(() => {
  replace.mockReset();
  signInWithCredentials.mockReset();
  signInWithCredentials.mockResolvedValue({ error: undefined });
});

function renderLoginForm(locale: Locale = 'zh-CN') {
  return renderWithIntl(
    <ToastProvider>
      <LoginForm />
    </ToastProvider>,
    locale
  );
}

async function submit(username: string, password: string, locale: Locale = 'zh-CN') {
  const english = locale === 'en-US';
  await userEvent.type(screen.getByPlaceholderText(english ? 'Enter username' : '请输入用户名'), username);
  await userEvent.type(screen.getByPlaceholderText(english ? 'Enter password' : '请输入密码'), password);
  await userEvent.click(screen.getByTestId('login-submit'));
}

test('signs in with username/password and navigates home on success', async () => {
  renderLoginForm();

  await submit('admin', 'admin123');

  await waitFor(() =>
    expect(signInWithCredentials).toHaveBeenCalledWith('credentials', { username: 'admin', password: 'admin123' }, '/')
  );
  await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
});

test('shows the error toast and stays on the page when sign-in fails', async () => {
  signInWithCredentials.mockResolvedValue({ error: 'CredentialsSignin' });
  renderLoginForm();

  await submit('admin', 'wrong');

  expect(await screen.findByText('用户名或密码错误')).toBeInTheDocument();
  expect(replace).not.toHaveBeenCalled();
});

test('renders the login form in English', async () => {
  signInWithCredentials.mockResolvedValue({ error: 'CredentialsSignin' });
  renderLoginForm('en-US');

  expect(screen.getByText('Ops admin sign in')).toBeInTheDocument();

  await submit('admin', 'wrong', 'en-US');

  expect(await screen.findByText('Incorrect username or password.')).toBeInTheDocument();
  expect(replace).not.toHaveBeenCalled();
});
