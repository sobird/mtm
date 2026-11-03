import { PERMISSIONS } from '@mtm/contracts';

import { RoleManager } from '@/components/system/RoleManager';
import { requireMerchantPermission } from '@/lib/page-guard';

export default async function RolesPage() {
  await requireMerchantPermission(PERMISSIONS.ROLE_MANAGE);

  return <RoleManager />;
}
