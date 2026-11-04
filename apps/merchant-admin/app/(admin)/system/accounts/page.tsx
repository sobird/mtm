import { PERMISSIONS } from '@mtm/contracts';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AccountManager } from '@/components/system/AccountManager';
import { requireMerchantPermission } from '@/lib/page-guard';

export async function generateMetadata(): Promise<Metadata> {
  const [t, app] = await Promise.all([getTranslations('system.accounts'), getTranslations('common.appTitle')]);

  return { title: `${t('title')} - ${app('merchant')}` };
}

export default async function AccountsPage() {
  await requireMerchantPermission(PERMISSIONS.ACCOUNT_MANAGE);

  return <AccountManager />;
}
