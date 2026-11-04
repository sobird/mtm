import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SettleinpcNotice } from '@/components/entry/SettleinpcNotice';

export async function generateMetadata(): Promise<Metadata> {
  const [t, app] = await Promise.all([getTranslations('entry.meta'), getTranslations('common.appTitle')]);

  return { title: `${t('settleinpc')} - ${app('merchant')}` };
}

export default function SettleinpcPage() {
  return <SettleinpcNotice />;
}
