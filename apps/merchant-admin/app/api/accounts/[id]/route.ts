import { PERMISSIONS } from '@mtm/contracts';

import { parseBody, withPermission } from '@/lib/handler';
import { updateAccount } from '@/lib/services/account-admin';
import { accountUpdateSchema } from '@/lib/validation/system';

export const PATCH = withPermission(PERMISSIONS.ACCOUNT_MANAGE, async ({ accountId, merchantId, request, params }) => {
  const input = await parseBody(request, accountUpdateSchema);

  return updateAccount(accountId, merchantId, params.id, input);
});
