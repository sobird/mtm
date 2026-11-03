import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: '登录 - 开源电商商家管理后台',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const raw = (await searchParams).callbackUrl;
  const callbackUrl = Array.isArray(raw) ? raw[0] : raw;

  return <LoginForm callbackUrl={callbackUrl} />;
}
