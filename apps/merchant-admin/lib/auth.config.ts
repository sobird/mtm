import { useSecureCookies } from '@mtm/auth/cookies';
import type { NextAuthConfig } from 'next-auth';

const secureCookies = useSecureCookies();

/**
 * Edge-safe Auth.js configuration.
 *
 * Auth.js is instantiated from this object in `middleware.ts`, which runs on the
 * Edge runtime. Keep this module free of Node-only imports (`next/headers`,
 * database clients, ...); the Credentials provider and its `authorize`
 * callback live in `lib/auth.ts`, which is server-only.
 */
export const authConfig = {
  // Self-hosted deployment: trust the incoming host instead of requiring
  // `AUTH_URL` to be configured (Auth.js throws `UntrustedHost` otherwise).
  trustHost: true,
  useSecureCookies: secureCookies,
  session: {
    strategy: 'jwt',
    maxAge: 2 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  cookies: {
    sessionToken: {
      name: secureCookies ? '__Secure-merchant.session' : 'merchant.session',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: secureCookies,
      },
    },
  },
  providers: [],
  callbacks: {
    /**
     * Keep callback URLs relative. Next.js standalone builds request URLs from
     * the bound hostname (`0.0.0.0`), so resolving `/login` against the request
     * origin would send the browser to `http://0.0.0.0:3000/login`.
     */
    redirect({ url }) {
      if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\')) {
        return url;
      }

      try {
        const { pathname, search, hash } = new URL(url);
        if (pathname.startsWith('//')) {
          return '/';
        }
        return `${pathname}${search}${hash}`;
      } catch {
        return '/';
      }
    },
    jwt({ token, user }) {
      if (user) {
        token.accountId = String(user.accountId);
        token.merchantId = String(user.merchantId);
        token.mobile = user.mobile;
        token.interCode = user.interCode;
        token.login = user.login;
        token.name = user.name;
        token.sub = String(user.accountId);
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        // Tokens issued before the Prisma migration may still carry numeric
        // ids, so normalize them instead of trusting the token shape.
        if (token.accountId !== undefined) {
          session.user.accountId = String(token.accountId);
        }
        if (token.merchantId !== undefined) {
          session.user.merchantId = String(token.merchantId);
        }
        session.user.mobile = token.mobile as string;
        session.user.interCode = token.interCode as string;
        session.user.login = token.login as string;
        session.user.name = token.name as string;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
