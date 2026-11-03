import { PERMISSIONS } from '@mtm/contracts';

import { parseBody, withPermission } from '@/lib/handler';
import { updateRole } from '@/lib/services/role-admin';
import { roleUpdateSchema } from '@/lib/validation/system';

export const PATCH = withPermission(PERMISSIONS.ROLE_MANAGE, async ({ accountId, merchantId, request, params }) => {
  const input = await parseBody(request, roleUpdateSchema);

  return updateRole(merchantId, params.id, input, accountId);
});
