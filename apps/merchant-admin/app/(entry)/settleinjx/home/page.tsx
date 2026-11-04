import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { EntryHome } from '@/components/entry/EntryHome';

export async function generateMetadata(): Promise<Metadata> {
  const [t, app] = await Promise.all([getTranslations('entry.meta'), getTranslations('common.appTitle')]);

  return { title: `${t('home')} - ${app('merchant')}` };
}

export default function SettleinjxHomePage() {
  return <EntryHome />;
}
