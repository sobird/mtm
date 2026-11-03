import { DashboardGrid, DashboardGridItem } from '@/components/dashboard/DashboardGrid';
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

import styles from './MarketHome.module.css';

export function MarketHome() {
  return (
    <DashboardGrid className={styles.grid}>
      <DashboardGridItem span={24}>
        <LatestNews />
      </DashboardGridItem>
      <DashboardGridItem span={24}>
        <Overview />
      </DashboardGridItem>
      <DashboardGridItem span={12}>
        <Realdata />
      </DashboardGridItem>
      <DashboardGridItem span={12}>
        <MerchantGrowth />
      </DashboardGridItem>
      <DashboardGridItem span={12}>
        <Violations />
      </DashboardGridItem>
      <DashboardGridItem span={12}>
        <ProductManage />
      </DashboardGridItem>
      <DashboardGridItem span={12}>
        <TrendingChart />
      </DashboardGridItem>
      <DashboardGridItem span={12}>
        <FundManage />
      </DashboardGridItem>
      <DashboardGridItem span={12}>
        <GoldMerchant />
      </DashboardGridItem>
      <DashboardGridItem span={12}>
        <MarketActivity />
      </DashboardGridItem>
    </DashboardGrid>
  );
}

export default MarketHome;
