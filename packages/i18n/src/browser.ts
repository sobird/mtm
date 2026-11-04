import { LOCALE_COOKIE, type Locale } from './locale';

export function buildLocaleCookie(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function persistLocale(locale: Locale): void {
  document.cookie = buildLocaleCookie(locale);
  window.location.reload();
}
