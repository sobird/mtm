import { PERMISSIONS } from '@mtm/contracts';

import { parseBody, withPermission } from '@/lib/handler';
import { resetAccountPassword } from '@/lib/services/account-admin';
import { accountPasswordSchema } from '@/lib/validation/system';

export const POST = withPermission(PERMISSIONS.ACCOUNT_MANAGE, async ({ accountId, request, params }) => {
  const { password } = await parseBody(request, accountPasswordSchema);

  await resetAccountPassword(accountId, params.id, password);

  return null;
});
