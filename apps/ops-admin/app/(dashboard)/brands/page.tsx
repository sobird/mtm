import { PERMISSIONS } from '@mtm/contracts';

import { BrandManager } from '@/components/catalog/BrandManager';
import { requireOpsPermission } from '@/lib/page-guard';

export default async function BrandsPage() {
  await requireOpsPermission(PERMISSIONS.BRAND_MANAGE);

  return <BrandManager />;
}
