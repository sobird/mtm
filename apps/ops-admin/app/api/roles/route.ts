import { PERMISSIONS } from '@mtm/contracts';

import { parseBody, withPermission } from '@/lib/handler';
import { createRole, listRoles } from '@/lib/services/role-admin';
import { roleCreateSchema } from '@/lib/validation/system';

export const GET = withPermission(PERMISSIONS.ROLE_MANAGE, async () => listRoles());

export const POST = withPermission(PERMISSIONS.ROLE_MANAGE, async ({ accountId, request }) => {
  const input = await parseBody(request, roleCreateSchema);

  return createRole(accountId, input);
});
