'use client';

import { DEFAULT_TIME_ZONE, handleIntlError } from '@mtm/i18n';
import type { AbstractIntlMessages } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

export function IntlProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: AbstractIntlMessages;
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider locale={locale} timeZone={DEFAULT_TIME_ZONE} messages={messages} onError={handleIntlError}>
      {children}
    </NextIntlClientProvider>
  );
}
