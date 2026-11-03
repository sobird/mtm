import { DashboardGrid, DashboardGridItem } from '@/components/dashboard/DashboardGrid';
import { PageContainer } from '@/components/layout/PageContainer';
import LatestNews from '@/components/market/remotes/LatestNews';
import Workbench from '@/components/market/remotes/Workbench';

export default function AdminHomePage() {
  return (
    <PageContainer title='经营概览' description='欢迎回到美团电商商家管理后台'>
      <DashboardGrid>
        <DashboardGridItem span={24}>
          <LatestNews />
        </DashboardGridItem>
        <DashboardGridItem span={24}>
          <Workbench />
        </DashboardGridItem>
      </DashboardGrid>
    </PageContainer>
  );
}
