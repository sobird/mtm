'use client';

import { SUPPORTED_LOCALES, type Locale } from '@mtm/i18n';
import { persistLocale } from '@mtm/i18n/browser';
import { useLocale, useTranslations } from 'next-intl';

const LOCALE_LABELS: Record<Locale, string> = {
  'zh-CN': '中文', // i18n-ignore: locale display names are static data, not UI copy
  'en-US': 'English',
};

export function LocaleSwitcher() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <select
      data-testid='locale-switcher'
      aria-label={t('common.language')}
      value={locale}
      onChange={event => persistLocale(event.target.value as Locale)}
      style={{ border: '1px solid #d9d9d9', borderRadius: 4, padding: '2px 6px', background: 'transparent' }}
    >
      {SUPPORTED_LOCALES.map(value => (
        <option key={value} value={value}>
          {LOCALE_LABELS[value]}
        </option>
      ))}
    </select>
  );
}

export default LocaleSwitcher;
