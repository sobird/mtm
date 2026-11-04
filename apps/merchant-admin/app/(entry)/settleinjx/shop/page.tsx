import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { EntryShop } from '@/components/entry/EntryShop';

export async function generateMetadata(): Promise<Metadata> {
  const [t, app] = await Promise.all([getTranslations('entry.meta'), getTranslations('common.appTitle')]);

  return { title: `${t('shop')} - ${app('merchant')}` };
}

export default function SettleinjxShopPage() {
  return <EntryShop />;
}
