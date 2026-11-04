import { PERMISSIONS } from '@mtm/contracts';

import { ProductForm } from '@/components/product/ProductForm';
import { requireMerchantPermission } from '@/lib/page-guard';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMerchantPermission(PERMISSIONS.PRODUCT_VIEW);
  const { id } = await params;
  return <ProductForm mode='edit' productId={id} />;
}
