import { Empty, PageContainer } from '@mtm/ui';

import { callCoreApi } from '@/lib/core-api';

export const dynamic = 'force-dynamic';

export default async function DashboardHomePage() {
  let coreApiConnected = false;

  try {
    await callCoreApi('/me');
    coreApiConnected = true;
  } catch {
    coreApiConnected = false;
  }

  return (
    <PageContainer title='运营后台' description='开源电商运营后台'>
      <Empty description={coreApiConnected ? '核心服务已连接' : '核心服务未连接'} />
    </PageContainer>
  );
}
