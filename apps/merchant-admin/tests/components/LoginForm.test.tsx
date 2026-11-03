import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { ToastProvider } from '@/components/ui/Toast';

const replace = vi.fn();
const signIn = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => signIn(...args),
}));

import { LoginForm } from '@/components/auth/LoginForm';

afterEach(cleanup);

beforeEach(() => {
  replace.mockReset();
  signIn.mockReset();
  signIn.mockResolvedValue({ error: undefined });
});

function renderLoginForm() {
  return render(
    <ToastProvider>
      <LoginForm />
    </ToastProvider>
  );
}

test('does not sign in and shows the error for an invalid mobile', async () => {
  renderLoginForm();

  await userEvent.type(screen.getByPlaceholderText('请输入手机号'), '123');
  await userEvent.type(screen.getByPlaceholderText('请输入验证码'), '123456');
  await userEvent.click(screen.getByRole('button', { name: '登录' }));

  expect(await screen.findByText('手机号格式不符合要求')).toBeInTheDocument();
  expect(signIn).not.toHaveBeenCalled();
});

test('signs in with credentials and replaces the route on success', async () => {
  renderLoginForm();

  await userEvent.type(screen.getByPlaceholderText('请输入手机号'), '13412345678');
  await userEvent.type(screen.getByPlaceholderText('请输入验证码'), '123456');
  await userEvent.click(screen.getByRole('button', { name: '登录' }));

  await waitFor(() =>
    expect(signIn).toHaveBeenCalledWith('credentials', {
      interCode: '86',
      mobile: '13412345678',
      captcha: '123456',
      redirect: false,
    })
  );
  await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
});
