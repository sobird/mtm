import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import { authConfig } from '@/lib/auth.config';

// These pages are reachable without a session.
const PUBLIC_PATHS = ['/login', '/register', '/settleinpc', '/settleinjx'];

export default NextAuth(authConfig).auth(req => {
  const { pathname, search } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth);

  // A signed-in user has no business on the login page.
  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  const isPublic = PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`));

  if (!isLoggedIn && !isPublic) {
    const callbackUrl = encodeURIComponent(pathname + search);

    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.nextUrl));
  }

  return NextResponse.next();
});

// API routes authenticate per handler (`withAuth`), so they are never matched
// here; a middleware redirect would turn an API 401 into a 302.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
