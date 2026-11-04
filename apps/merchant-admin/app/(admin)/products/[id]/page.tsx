import { PERMISSIONS } from '@mtm/contracts';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ProductForm } from '@/components/product/ProductForm';
import { requireMerchantPermission } from '@/lib/page-guard';

export async function generateMetadata(): Promise<Metadata> {
  const [t, app] = await Promise.all([getTranslations('product.form'), getTranslations('common.appTitle')]);

  return { title: `${t('editTitle')} - ${app('merchant')}` };
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMerchantPermission(PERMISSIONS.PRODUCT_VIEW);
  const { id } = await params;
  return <ProductForm mode='edit' productId={id} />;
}
