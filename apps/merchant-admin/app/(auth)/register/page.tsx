import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { RegisterForm } from '@/components/auth/RegisterForm';

export async function generateMetadata(): Promise<Metadata> {
  const [t, app] = await Promise.all([getTranslations('auth.register'), getTranslations('common.appTitle')]);

  return { title: `${t('title')} - ${app('merchant')}` };
}

export default function RegisterPage() {
  return <RegisterForm />;
}
