import { PERMISSIONS } from '@mtm/contracts';

import { CategoryManager } from '@/components/catalog/CategoryManager';
import { requireOpsPermission } from '@/lib/page-guard';

export default async function CategoriesPage() {
  await requireOpsPermission(PERMISSIONS.CATEGORY_VIEW);

  return <CategoryManager />;
}
