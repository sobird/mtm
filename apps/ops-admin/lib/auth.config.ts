import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe Auth.js configuration.
 *
 * Auth.js is instantiated from this object in `middleware.ts`, which runs on the
 * Edge runtime. Keep this module free of Node-only imports (`next/headers`,
 * database clients, ...); the Credentials provider and its `authorize`
 * callback live in `lib/auth.ts`, which is server-only.
 */
export const authConfig = {
  // Auth.js only auto-reads `AUTH_SECRET`; the ops portal uses its own secret so
  // a merchant session can never be replayed against the ops portal.
  secret: process.env.OPS_AUTH_SECRET,
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
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-ops.session' : 'ops.session',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [],
  callbacks: {
    /**
     * Keep callback URLs relative. Next.js standalone builds request URLs from
     * the bound hostname (`0.0.0.0`), so resolving `/login` against the request
     * origin would send the browser to `http://0.0.0.0:3001/login`.
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
        token.username = user.username;
        token.name = user.name;
        token.portal = 'ops';
        token.sub = String(user.accountId);
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        // Tokens issued by an older deployment may not carry every claim, so
        // normalize them instead of trusting the token shape.
        session.user.accountId = String(token.accountId ?? '');
        session.user.username = String(token.username ?? '');
        session.user.name = String(token.name ?? '');
        session.user.portal = 'ops';
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
