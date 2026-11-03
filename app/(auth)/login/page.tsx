import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: '登录 - 美团电商商家管理后台',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;

  return <LoginForm callbackUrl={callbackUrl} />;
}
