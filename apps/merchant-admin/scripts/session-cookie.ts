import { pathToFileURL } from 'node:url';

import { useSecureCookies } from '@mtm/auth/cookies';
import { encode } from 'next-auth/jwt';

/** Session for the seeded demo account (account 1 / merchant 1). */
const SEED_SESSION = {
  sub: '1',
  accountId: 1,
  merchantId: 1,
  mobile: '13412345678',
  interCode: '86',
  login: 'merchant@example.com',
  name: '演示商家管理员',
};

/**
 * Builds a ready-to-use `Cookie` header for the seeded account. The token is
 * produced by the same encoder Auth.js uses, so it decrypts on the server.
 */
export async function createSessionCookie(): Promise<string> {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }

  const cookieName = useSecureCookies() ? '__Secure-merchant.session' : 'merchant.session';

  const token = await encode({
    token: SEED_SESSION,
    salt: cookieName,
    secret,
    maxAge: 2 * 60 * 60,
  });

  return `${cookieName}=${token}`;
}

const entry = process.argv[1];

if (entry && import.meta.url === pathToFileURL(entry).href) {
  createSessionCookie()
    .then(cookie => {
      console.log(cookie);
    })
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
}
