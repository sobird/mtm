import { PERMISSIONS } from '@mtm/contracts';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { RoleManager } from '@/components/system/RoleManager';
import { requireMerchantPermission } from '@/lib/page-guard';

export async function generateMetadata(): Promise<Metadata> {
  const [t, app] = await Promise.all([getTranslations('system.roles'), getTranslations('common.appTitle')]);

  return { title: `${t('title')} - ${app('merchant')}` };
}

export default async function RolesPage() {
  await requireMerchantPermission(PERMISSIONS.ROLE_MANAGE);

  return <RoleManager />;
}
