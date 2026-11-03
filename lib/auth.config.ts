import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe Auth.js configuration.
 *
 * Auth.js is instantiated from this object in `middleware.ts`, which runs on the
 * Edge runtime. Keep this module free of Node-only imports (`sequelize`,
 * `sqlite3`, `next/headers`, ...); the Credentials provider and its `authorize`
 * callback live in `lib/auth.ts`, which is server-only.
 */
export const authConfig = {
  // Self-hosted deployment: trust the incoming host instead of requiring
  // `AUTH_URL` to be configured (Auth.js throws `UntrustedHost` otherwise).
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production',
  session: {
    strategy: 'jwt',
    maxAge: 2 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accountId = user.accountId;
        token.merchantId = user.merchantId;
        token.mobile = user.mobile;
        token.interCode = user.interCode;
        token.login = user.login;
        token.sub = String(user.accountId);
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.accountId = token.accountId as number;
        session.user.merchantId = token.merchantId as number;
        session.user.mobile = token.mobile as string;
        session.user.interCode = token.interCode as string;
        session.user.login = token.login as string;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
