import { PERMISSIONS } from '@mtm/contracts';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ProductManager } from '@/components/product/ProductManager';
import { requireMerchantPermission } from '@/lib/page-guard';

export async function generateMetadata(): Promise<Metadata> {
  const [t, app] = await Promise.all([getTranslations('product.list'), getTranslations('common.appTitle')]);

  return { title: `${t('title')} - ${app('merchant')}` };
}

export default async function ProductsPage() {
  await requireMerchantPermission(PERMISSIONS.PRODUCT_VIEW);

  return <ProductManager />;
}
