import { PERMISSIONS } from '@mtm/contracts';

import { ProductManager } from '@/components/catalog/ProductManager';
import { requireOpsPermission } from '@/lib/page-guard';

export default async function ProductsPage() {
  await requireOpsPermission(PERMISSIONS.PRODUCT_VIEW);

  return <ProductManager />;
}
