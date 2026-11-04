import { PERMISSIONS } from '@mtm/contracts';

import { ProductForm } from '@/components/product/ProductForm';
import { requireMerchantPermission } from '@/lib/page-guard';

export default async function NewProductPage() {
  await requireMerchantPermission(PERMISSIONS.PRODUCT_CREATE);
  return <ProductForm mode='create' />;
}
