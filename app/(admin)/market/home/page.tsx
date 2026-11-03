import { PageContainer } from '@/components/layout/PageContainer';
import { Empty } from '@/components/ui';

export default function MarketHomePage() {
  return (
    <PageContainer title='营销中心' breadcrumbs={[{ label: '首页', href: '/' }, { label: '营销中心' }]}>
      <Empty description='营销首页即将上线' />
    </PageContainer>
  );
}
