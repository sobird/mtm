import { PERMISSIONS } from '@mtm/contracts';

import { parseBody, withPermission } from '@/lib/handler';
import { resetAccountPassword } from '@/lib/services/account-admin';
import { accountPasswordSchema } from '@/lib/validation/system';

export const POST = withPermission(PERMISSIONS.ACCOUNT_MANAGE, async ({ accountId, merchantId, request, params }) => {
  const { password } = await parseBody(request, accountPasswordSchema);

  await resetAccountPassword(accountId, merchantId, params.id, password);

  return null;
});
