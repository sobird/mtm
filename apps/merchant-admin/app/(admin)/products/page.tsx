import { PERMISSIONS } from '@mtm/contracts';

import { ProductManager } from '@/components/product/ProductManager';
import { requireMerchantPermission } from '@/lib/page-guard';

export default async function ProductsPage() {
  await requireMerchantPermission(PERMISSIONS.PRODUCT_VIEW);

  return <ProductManager />;
}
