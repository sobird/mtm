import { getTranslations } from 'next-intl/server';

import { PageContainer } from '@/components/layout/PageContainer';
import { MarketHome } from '@/components/market/home/MarketHome';

export default async function MarketHomePage() {
  const [t, common] = await Promise.all([getTranslations('marketing.home'), getTranslations('common')]);

  return (
    <PageContainer title={t('title')} breadcrumbs={[{ label: common('home'), href: '/' }, { label: t('title') }]}>
      <MarketHome />
    </PageContainer>
  );
}
