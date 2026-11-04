import { PERMISSIONS } from '@mtm/contracts';

import { parseBody, parseQuery, withPermission } from '@/lib/handler';
import { createAccount, listAccounts } from '@/lib/services/account-admin';
import { accountCreateSchema, accountListQuerySchema } from '@/lib/validation/system';

export const GET = withPermission(PERMISSIONS.ACCOUNT_MANAGE, async ({ request }) => {
  const query = parseQuery(request, accountListQuerySchema);

  return listAccounts({
    page: query.page,
    pageSize: query.pageSize,
    keyword: query.keyword,
    status: query.status,
  });
});

export const POST = withPermission(PERMISSIONS.ACCOUNT_MANAGE, async ({ accountId, request }) => {
  const input = await parseBody(request, accountCreateSchema);

  return createAccount(accountId, input);
});
