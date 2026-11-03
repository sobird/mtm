import { AdminShell, PermissionProvider } from '@mtm/ui';
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

  const [{ menuItems }, snapshot] = await Promise.all([getMenu(user.accountId), getAccountPermissions(user.accountId)]);

  return (
    <PermissionProvider permissions={snapshot.codes}>
      <AdminShell
        title='开源电商运营后台'
        menu={menuItems}
        account={{ name: user.name ?? '', username: user.username }}
      >
        {children}
      </AdminShell>
    </PermissionProvider>
  );
}
