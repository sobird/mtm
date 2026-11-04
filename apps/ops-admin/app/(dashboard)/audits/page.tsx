import { PERMISSIONS } from '@mtm/contracts';

import { AuditManager } from '@/components/catalog/AuditManager';
import { requireOpsPermission } from '@/lib/page-guard';

export default async function AuditsPage() {
  await requireOpsPermission(PERMISSIONS.PRODUCT_AUDIT);

  return <AuditManager />;
}
