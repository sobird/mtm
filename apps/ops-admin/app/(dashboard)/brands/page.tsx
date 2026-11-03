import { PERMISSIONS } from '@mtm/contracts';
import { Empty, PageContainer } from '@mtm/ui';

import { requireOpsPermission } from '@/lib/page-guard';

export default async function BrandsPage() {
  await requireOpsPermission(PERMISSIONS.BRAND_MANAGE);

  return (
    <PageContainer title='品牌管理'>
      <Empty description='该模块将在后续阶段提供' />
    </PageContainer>
  );
}
