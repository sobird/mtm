import { PERMISSIONS } from '@mtm/contracts';

import { MerchantManager } from '@/components/catalog/MerchantManager';
import { requireOpsPermission } from '@/lib/page-guard';

export default async function MerchantsPage() {
  await requireOpsPermission(PERMISSIONS.MERCHANT_VIEW);

  return <MerchantManager />;
}
