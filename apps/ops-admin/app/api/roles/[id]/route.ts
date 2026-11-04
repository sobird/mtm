import { PERMISSIONS } from '@mtm/contracts';

import { parseBody, withPermission } from '@/lib/handler';
import { updateRole } from '@/lib/services/role-admin';
import { roleUpdateSchema } from '@/lib/validation/system';

export const PATCH = withPermission(PERMISSIONS.ROLE_MANAGE, async ({ accountId, request, params }) => {
  const input = await parseBody(request, roleUpdateSchema);

  return updateRole(accountId, params.id, input);
});
