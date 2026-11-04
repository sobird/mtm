import { getMessages, handleIntlError, type Locale } from '@mtm/i18n';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';

export function renderWithIntl(ui: ReactElement, locale: Locale = 'zh-CN') {
  return render(
    <NextIntlClientProvider locale={locale} messages={getMessages(locale)} onError={handleIntlError}>
      {ui}
    </NextIntlClientProvider>
  );
}
