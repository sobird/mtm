import { verifyPassword } from '@mtm/auth/password';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { cookies } from 'next/headers';

import { authConfig } from '@/lib/auth.config';
import { initDatabase } from '@/lib/db';
import { assertProductionSecret } from '@/lib/env';
import { merchantLoginLimiter } from '@/lib/rate-limit';
import {
  findMerchantAccountByIdentifier,
  findMerchantAccountByPhone,
  markMerchantAccountLogin,
  recordMerchantLogin,
  upsertAccount,
} from '@/lib/services/account';
import { verifyCaptcha } from '@/lib/services/captcha';
import { passwordLoginSchema } from '@/lib/validation/auth';
import { isMobilePhone } from '@/lib/validation/phone';

export interface MerchantSessionUser {
  id: string;
  accountId: string;
  login: string;
  name: string;
  mobile: string;
  interCode: string;
  merchantId: string;
  portal: 'merchant';
}

/**
 * Verifies a merchant username/phone + password pair and records the attempt.
 *
 * Failures (wrong password, unknown user, disabled account, threshold reached)
 * all return `null` so callers cannot distinguish them. Unknown identifiers are
 * rate limited but not logged because `MerchantLoginLog.accountId` is required.
 */
export async function authenticateMerchantPassword(
  identifier: string,
  password: string
): Promise<MerchantSessionUser | null> {
  await initDatabase();
  assertProductionSecret();

  const trimmed = identifier.trim();
  const key = `merchant:${trimmed.toLowerCase()}`;
  if (merchantLoginLimiter.isBlocked(key)) {
    return null;
  }

  const account = await findMerchantAccountByIdentifier(trimmed);
  if (!account) {
    merchantLoginLimiter.recordFailure(key);
    return null;
  }

  if (account.status !== 'ACTIVE') {
    await recordMerchantLogin(account.id, false);
    merchantLoginLimiter.recordFailure(key);
    return null;
  }

  const valid = account.passwordHash ? await verifyPassword(account.passwordHash, password) : false;
  await recordMerchantLogin(account.id, valid);

  if (!valid) {
    merchantLoginLimiter.recordFailure(key);
    return null;
  }

  merchantLoginLimiter.reset(key);
  await markMerchantAccountLogin(account.id);

  return {
    id: account.id,
    accountId: account.id,
    login: account.username,
    name: account.name,
    mobile: account.phone ?? '',
    interCode: account.interCode,
    merchantId: account.merchantId,
    portal: 'merchant',
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: 'credentials',
      credentials: {
        interCode: { label: '区号', type: 'text' },
        mobile: { label: '手机号', type: 'text' },
        captcha: { label: '验证码', type: 'text' },
      },
      async authorize(credentials) {
        await initDatabase();
        assertProductionSecret();

        const interCode = String(credentials?.interCode ?? '');
        const mobile = String(credentials?.mobile ?? '');
        const captcha = String(credentials?.captcha ?? '');

        // Returning `null` yields the standard `CredentialsSignin` error
        // instead of the misleading `Configuration` error that a thrown,
        // non-Auth.js error produces.
        if (!isMobilePhone(mobile, interCode)) {
          return null;
        }

        const cookieStore = await cookies();
        const captchaToken = cookieStore.get('mtm_captcha')?.value;

        if (!(await verifyCaptcha(captchaToken, captcha))) {
          const existing = await findMerchantAccountByPhone(interCode, mobile);
          if (existing) {
            await recordMerchantLogin(existing.id, false);
          }
          return null;
        }

        const account = await upsertAccount({ interCode, mobile });
        await recordMerchantLogin(account.id, true);
        await markMerchantAccountLogin(account.id);

        return {
          id: account.id,
          name: account.name,
          accountId: account.id,
          mobile: account.mobile,
          interCode: account.interCode,
          merchantId: account.merchantId,
          login: account.login,
          portal: 'merchant',
        };
      },
    }),
    Credentials({
      id: 'password',
      credentials: {
        identifier: { label: '用户名或手机号', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = passwordLoginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        return authenticateMerchantPassword(parsed.data.identifier, parsed.data.password);
      },
    }),
  ],
});
