import { PermissionProvider } from '@mtm/ui';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AdminShell } from '@/components/layout/AdminShell';
import { auth } from '@/lib/auth';
import { initDatabase } from '@/lib/db';
import { getAccount } from '@/lib/services/account';
import { getMenu, getMenuBadges } from '@/lib/services/menu';
import { getAccountPermissions } from '@/lib/services/permission';

// Auth.js reads request cookies and the menu is per-account, so this layout
// must render per request rather than being prerendered at build time.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user?.accountId) {
    redirect('/login');
  }

  // Server components bypass Route Handlers, so the schema/seed bootstrap that
  // every `/api/*` handler performs must run here as well (R-32).
  await initDatabase();

  const [menu, badges, account, permissions] = await Promise.all([
    getMenu(session.user.accountId),
    getMenuBadges(),
    getAccount(session.user.accountId),
    getAccountPermissions(session.user.accountId),
  ]);

  return (
    <PermissionProvider permissions={permissions.codes}>
      <AdminShell menuItems={menu.menuItems} favorites={menu.favorites} badges={badges} account={account}>
        {children}
      </AdminShell>
    </PermissionProvider>
  );
}
