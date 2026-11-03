import { PERMISSIONS } from '@mtm/contracts';
import { Empty, PageContainer } from '@mtm/ui';

import { requireOpsPermission } from '@/lib/page-guard';

export default async function AuditsPage() {
  await requireOpsPermission(PERMISSIONS.PRODUCT_AUDIT);

  return (
    <PageContainer title='商品审核'>
      <Empty description='该模块将在后续阶段提供' />
    </PageContainer>
  );
}
