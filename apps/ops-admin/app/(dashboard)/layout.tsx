import { AdminShell, PermissionProvider } from '@mtm/ui';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { auth } from '@/lib/auth';
import { initDatabase } from '@/lib/db';
import { getMenu } from '@/lib/services/menu';
import { getAccountPermissions } from '@/lib/services/permission';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await initDatabase();

  const session = await auth();
  const user = session?.user;

  if (!user?.accountId) {
    redirect('/login');
  }

  const [{ menuItems }, snapshot, t] = await Promise.all([
    getMenu(user.accountId),
    getAccountPermissions(user.accountId),
    getTranslations('common.appTitle'),
  ]);

  return (
    <PermissionProvider permissions={snapshot.codes}>
      <AdminShell title={t('ops')} menu={menuItems} account={{ name: user.name ?? '', username: user.username }}>
        {children}
      </AdminShell>
    </PermissionProvider>
  );
}
