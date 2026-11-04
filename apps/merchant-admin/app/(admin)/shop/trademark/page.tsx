import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PageContainer } from '@/components/layout/PageContainer';
import TrademarkButtonTab from '@/components/shop/trademark/TrademarkButtonTab';
import { Empty } from '@/components/ui';

export async function generateMetadata(): Promise<Metadata> {
  const [t, app] = await Promise.all([getTranslations('shop.trademark'), getTranslations('common.appTitle')]);

  return { title: `${t('title')} - ${app('merchant')}` };
}

export default async function ShopTrademarkPage() {
  const t = await getTranslations('shop');

  return (
    <PageContainer
      title={t('trademark.title')}
      breadcrumbs={[
        { label: t('breadcrumb.home'), href: '/' },
        { label: t('breadcrumb.shop') },
        { label: t('breadcrumb.trademark') },
      ]}
    >
      <Empty description={t('trademark.empty')} />
      <TrademarkButtonTab />
    </PageContainer>
  );
}
