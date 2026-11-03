import { PERMISSIONS } from '@mtm/contracts';
import { Empty, PageContainer } from '@mtm/ui';

import { requireOpsPermission } from '@/lib/page-guard';

export default async function CategoriesPage() {
  await requireOpsPermission(PERMISSIONS.CATEGORY_VIEW);

  return (
    <PageContainer title='类目管理'>
      <Empty description='该模块将在后续阶段提供' />
    </PageContainer>
  );
}
