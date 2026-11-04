import { getMessages, handleIntlError, normalizeLocale, LOCALE_COOKIE } from '@mtm/i18n';
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return { locale, messages: getMessages(locale), onError: handleIntlError };
});
