import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/PageContainer';
import { ProfileTabs } from '@/components/shop/profile/ProfileTabs';

export async function generateMetadata(): Promise<Metadata> {
  const [t, app] = await Promise.all([getTranslations('shop.profile'), getTranslations('common.appTitle')]);

  return { title: `${t('title')} - ${app('merchant')}` };
}

export default async function ShopProfileLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations('shop');

  return (
    <PageContainer
      title={t('profile.title')}
      breadcrumbs={[
        { label: t('breadcrumb.home'), href: '/' },
        { label: t('breadcrumb.shop') },
        { label: t('profile.title') },
      ]}
    >
      <ProfileTabs />
      {children}
    </PageContainer>
  );
}
