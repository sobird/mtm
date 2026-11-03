import { PERMISSIONS } from '@mtm/contracts';

import { RoleManager } from '@/components/system/RoleManager';
import { requireOpsPermission } from '@/lib/page-guard';

export default async function RolesPage() {
  await requireOpsPermission(PERMISSIONS.ROLE_MANAGE);

  return <RoleManager />;
}
