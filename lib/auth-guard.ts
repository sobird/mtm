import { auth } from '@/lib/auth';
import { assertProductionSecret } from '@/lib/env';
import { AppError } from '@/lib/errors';

export interface AuthContext {
  accountId: number;
  merchantId: number;
}

/** Returns the current account, throwing a 401 `AppError` when unauthenticated. */
export async function requireAccount(): Promise<AuthContext> {
  // A forged token signed with the committed placeholder must not authenticate.
  assertProductionSecret();

  const session = await auth();

  if (!session?.user?.accountId) {
    throw new AppError('UNAUTHORIZED', 401, '未登录');
  }

  return {
    accountId: session.user.accountId,
    merchantId: session.user.merchantId,
  };
}
