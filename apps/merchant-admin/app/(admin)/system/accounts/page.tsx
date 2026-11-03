import { PERMISSIONS } from '@mtm/contracts';

import { AccountManager } from '@/components/system/AccountManager';
import { requireMerchantPermission } from '@/lib/page-guard';

export default async function AccountsPage() {
  await requireMerchantPermission(PERMISSIONS.ACCOUNT_MANAGE);

  return <AccountManager />;
}
