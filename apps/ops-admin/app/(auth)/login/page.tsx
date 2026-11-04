import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LoginForm } from '@/components/auth/LoginForm';

export async function generateMetadata(): Promise<Metadata> {
  const [t, app] = await Promise.all([getTranslations('auth.opsLogin'), getTranslations('common.appTitle')]);

  return { title: `${t('title')} - ${app('ops')}` };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const raw = (await searchParams).callbackUrl;
  const callbackUrl = Array.isArray(raw) ? raw[0] : raw;

  return <LoginForm callbackUrl={callbackUrl} />;
}
