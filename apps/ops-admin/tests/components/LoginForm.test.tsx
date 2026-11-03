import { ToastProvider } from '@mtm/ui';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

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

function renderLoginForm() {
  return render(
    <ToastProvider>
      <LoginForm />
    </ToastProvider>
  );
}

async function submit(username: string, password: string) {
  await userEvent.type(screen.getByPlaceholderText('请输入用户名'), username);
  await userEvent.type(screen.getByPlaceholderText('请输入密码'), password);
  await userEvent.click(screen.getByRole('button', { name: '登录' }));
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
