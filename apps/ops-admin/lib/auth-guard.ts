import { auth } from '@/lib/auth';
import { assertProductionSecret } from '@/lib/env';
import { AppError } from '@/lib/errors';

export interface OpsAuthContext {
  accountId: string;
  username: string;
  name: string;
}

/** Returns the current operator, throwing a 401 `AppError` when unauthenticated. */
export async function requireOpsAccount(): Promise<OpsAuthContext> {
  // A forged token signed with the committed placeholder must not authenticate.
  assertProductionSecret('OPS_AUTH_SECRET');

  const session = await auth();

  if (!session?.user?.accountId) {
    throw new AppError('UNAUTHORIZED', 401, '未登录');
  }

  return {
    accountId: session.user.accountId,
    username: session.user.username,
    name: session.user.name ?? '',
  };
}
