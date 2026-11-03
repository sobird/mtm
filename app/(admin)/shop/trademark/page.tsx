import { PageContainer } from '@/components/layout/PageContainer';
import TrademarkButtonTab from '@/components/shop/trademark/TrademarkButtonTab';
import { Empty } from '@/components/ui';

export default function ShopTrademarkPage() {
  return (
    <PageContainer title='商标管理' breadcrumbs={[{ label: '首页', href: '/' }, { label: '店铺' }, { label: '商标' }]}>
      <Empty description='暂无商标信息' />
      <TrademarkButtonTab />
    </PageContainer>
  );
}
