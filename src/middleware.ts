/**
 * Temporary shim. Next resolves the middleware root from `src/` because the
 * legacy `src/pages` directory still exists (see `next/dist/lib/find-pages-dir`),
 * which makes the canonical root `middleware.ts` invisible during this
 * migration. Re-export it here so auth works until Task 23 removes `src/`.
 *
 * The matcher is repeated literally because Next reads it by static analysis of
 * this file; a re-exported `config` would be ignored and default to `/:path*`.
 */
export { default } from '../middleware';

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
