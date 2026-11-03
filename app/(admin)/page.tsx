import { DashboardGrid, DashboardGridItem } from '@/components/dashboard/DashboardGrid';
import { PageContainer } from '@/components/layout/PageContainer';
import FundManage from '@/components/market/remotes/FundManage';
import GoldMerchant from '@/components/market/remotes/GoldMerchant';
import LatestNews from '@/components/market/remotes/LatestNews';
import MarketActivity from '@/components/market/remotes/MarketActivity';
import MerchantGrowth from '@/components/market/remotes/MerchantGrowth';
import Overview from '@/components/market/remotes/Overview';
import ProductManage from '@/components/market/remotes/ProductManage';
import Realdata from '@/components/market/remotes/Realdata';
import TrendingChart from '@/components/market/remotes/TrendingChart';
import Violations from '@/components/market/remotes/Violations';

const rightColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
} as const;

export default function AdminHomePage() {
  return (
    <PageContainer title='经营概览' description='欢迎回到美团电商商家管理后台'>
      <DashboardGrid>
        <DashboardGridItem span={24}>
          <LatestNews />
        </DashboardGridItem>
        <DashboardGridItem span={24}>
          <Overview />
        </DashboardGridItem>
        <DashboardGridItem span={12}>
          <Realdata bodyStyle={{ height: 198 }} />
        </DashboardGridItem>
        <DashboardGridItem span={12}>
          <MerchantGrowth bodyStyle={{ height: 198 }} />
        </DashboardGridItem>
        <DashboardGridItem span={12}>
          <ProductManage />
        </DashboardGridItem>
        <DashboardGridItem span={12}>
          <FundManage />
        </DashboardGridItem>
        <DashboardGridItem span={12}>
          <GoldMerchant bodyStyle={{ height: 465 }} />
        </DashboardGridItem>
        <DashboardGridItem span={12}>
          <div style={rightColumnStyle}>
            <MarketActivity max={4} bodyStyle={{ paddingTop: 6 }} />
            <Violations bodyStyle={{ paddingTop: 16 }} />
          </div>
        </DashboardGridItem>
        <DashboardGridItem span={24}>
          <TrendingChart />
        </DashboardGridItem>
      </DashboardGrid>
    </PageContainer>
  );
}
