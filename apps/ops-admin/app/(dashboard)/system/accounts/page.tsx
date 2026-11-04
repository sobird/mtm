import { PERMISSIONS } from '@mtm/contracts';

import { AccountManager } from '@/components/system/AccountManager';
import { auth } from '@/lib/auth';
import { requireOpsPermission } from '@/lib/page-guard';

export default async function AccountsPage() {
  const session = await auth();

  await requireOpsPermission(PERMISSIONS.ACCOUNT_MANAGE);

  return <AccountManager currentAccountId={session!.user!.accountId} />;
}
