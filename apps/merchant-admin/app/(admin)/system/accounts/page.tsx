import { PERMISSIONS } from '@mtm/contracts';

import { PageContainer } from '@/components/layout/PageContainer';
import { Empty } from '@/components/ui';
import { requireMerchantPermission } from '@/lib/page-guard';

export default async function AccountsPage() {
  await requireMerchantPermission(PERMISSIONS.ACCOUNT_MANAGE);

  return (
    <PageContainer title='账号管理'>
      <Empty description='该模块将在后续任务提供' />
    </PageContainer>
  );
}
