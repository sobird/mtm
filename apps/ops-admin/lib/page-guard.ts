import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getAccountPermissions } from '@/lib/services/permission';
import type { PermissionSnapshot } from '@/lib/services/permission';

/**
 * Server-page permission guard.
 *
 * Unlike `requireOpsAccount`, an unauthenticated visitor is redirected to the
 * login page instead of receiving an API-style 401. Missing permission codes
 * redirect to /403.
 */
export async function requireOpsPermission(code: string): Promise<PermissionSnapshot> {
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
