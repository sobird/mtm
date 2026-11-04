import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { EntryCompany } from '@/components/entry/EntryCompany';

export async function generateMetadata(): Promise<Metadata> {
  const [t, app] = await Promise.all([getTranslations('entry.meta'), getTranslations('common.appTitle')]);

  return { title: `${t('company')} - ${app('merchant')}` };
}

export default function SettleinjxCompanyPage() {
  return <EntryCompany />;
}
