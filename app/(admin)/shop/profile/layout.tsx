import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/PageContainer';
import { ProfileTabs } from '@/components/shop/profile/ProfileTabs';

export default function ShopProfileLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      title='店铺信息'
      breadcrumbs={[{ label: '首页', href: '/' }, { label: '店铺' }, { label: '店铺信息' }]}
    >
      <ProfileTabs />
      {children}
    </PageContainer>
  );
}
