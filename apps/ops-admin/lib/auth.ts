import { verifyPassword } from '@mtm/auth/password';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { authConfig } from '@/lib/auth.config';
import { initDatabase } from '@/lib/db';
import { assertProductionSecret } from '@/lib/env';
import { opsLoginLimiter } from '@/lib/rate-limit';
import { findOpsAccountByUsername, markOpsAccountLogin, recordOpsLogin } from '@/lib/services/account';
import { loginSchema } from '@/lib/validation/auth';

export interface OpsSessionUser {
  id: string;
  accountId: string;
  username: string;
  name: string;
  portal: 'ops';
}

/**
 * Verifies an ops username/password pair and records the attempt.
 *
 * Failures (wrong password, unknown user, disabled account, threshold reached)
 * all return `null` so callers cannot distinguish them. Unknown users are rate
 * limited but not logged because `OpsLoginLog.accountId` is required.
 */
export async function authenticateOpsUser(username: string, password: string): Promise<OpsSessionUser | null> {
  await initDatabase();
  assertProductionSecret('OPS_AUTH_SECRET');

  const key = `ops:${username.trim().toLowerCase()}`;
  if (opsLoginLimiter.isBlocked(key)) {
    return null;
  }

  const account = await findOpsAccountByUsername(username.trim());
  if (!account || account.status !== 'ACTIVE') {
    opsLoginLimiter.recordFailure(key);
    return null;
  }

  const valid = await verifyPassword(account.passwordHash, password);
  await recordOpsLogin(account.id, valid);

  if (!valid) {
    opsLoginLimiter.recordFailure(key);
    return null;
  }

  opsLoginLimiter.reset(key);
  await markOpsAccountLogin(account.id);

  return {
    id: account.id,
    accountId: account.id,
    username: account.username,
    name: account.name,
    portal: 'ops',
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: '用户名', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        return authenticateOpsUser(parsed.data.username, parsed.data.password);
      },
    }),
  ],
});
