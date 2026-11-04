/**
 * Edge-safe helper for deciding whether Auth.js session cookies should carry
 * the `Secure` attribute (and the `__Secure-` name prefix).
 *
 * Auth.js defaults to marking cookies secure in production. Self-hosted
 * deployments served over plain HTTP need to opt out; `AUTH_COOKIE_SECURE`
 * lets operators override the `NODE_ENV`-derived default explicitly.
 */
export function useSecureCookies(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.AUTH_COOKIE_SECURE === 'true') return true;
  if (env.AUTH_COOKIE_SECURE === 'false') return false;
  return env.NODE_ENV === 'production';
}
