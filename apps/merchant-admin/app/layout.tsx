import { AntdRegistry } from '@ant-design/nextjs-registry';
import { handleIntlError, normalizeLocale } from '@mtm/i18n';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import Providers from './providers';

import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common.appTitle');
  const title = t('merchant');
  return { title, description: title };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = normalizeLocale(await getLocale());
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages} onError={handleIntlError}>
          <AntdRegistry>
            <Providers locale={locale}>{children}</Providers>
          </AntdRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
