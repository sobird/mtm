import { PageContainer } from '@/components/layout/PageContainer';
import { MarketHome } from '@/components/market/home/MarketHome';

export default function MarketHomePage() {
  return (
    <PageContainer title='营销中心' breadcrumbs={[{ label: '首页', href: '/' }, { label: '营销中心' }]}>
      <MarketHome />
    </PageContainer>
  );
}
