import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { cookies } from 'next/headers';

import { authConfig } from '@/lib/auth.config';
import { upsertAccount } from '@/lib/services/account';
import { verifyCaptcha } from '@/lib/services/captcha';
import { isMobilePhone } from '@/lib/validation/phone';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        interCode: { label: '区号', type: 'text' },
        mobile: { label: '手机号', type: 'text' },
        captcha: { label: '验证码', type: 'text' },
      },
      async authorize(credentials) {
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
          return null;
        }

        const account = await upsertAccount({ interCode, mobile });

        return {
          id: String(account.id),
          name: account.login,
          accountId: account.id,
          mobile: account.mobile,
          interCode: account.interCode,
          merchantId: account.merchantId,
          login: account.login,
        };
      },
    }),
  ],
});
