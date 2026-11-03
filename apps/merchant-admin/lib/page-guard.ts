import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getAccountPermissions } from '@/lib/services/permission';
import type { PermissionSnapshot } from '@/lib/services/permission';

/**
 * Server-page permission guard for the merchant portal.
 *
 * Missing sessions are sent to the login page; accounts that lack the exact
 * code are sent to /403.
 */
export async function requireMerchantPermission(code: string): Promise<PermissionSnapshot> {
  const session = await auth();

  if (!session?.user?.accountId) {
    redirect('/login');
  }

  const snapshot = await getAccountPermissions(session.user.accountId);

  if (!snapshot.set.has(code)) {
    redirect('/403');
  }

  return snapshot;
}
