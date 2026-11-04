import { createTranslator as createNextIntlTranslator } from 'next-intl';
import type { IntlError } from 'next-intl';

import enUS from '../messages/en-US.json';
import zhCN from '../messages/zh-CN.json';
import { DEFAULT_TIME_ZONE, type Locale } from './locale';

export type Messages = typeof zhCN;

export interface Translator {
  (key: string, values?: Record<string, string | number>): string;
  has(key: string): boolean;
}

export type Translate = Translator;

const MESSAGES: Record<Locale, Messages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}

export function handleIntlError(error: IntlError): void {
  if (error.code === 'MISSING_MESSAGE') {
    throw error;
  }

  console.error(error);
}

export function createTranslator(locale: Locale): Translator {
  return createNextIntlTranslator({
    locale,
    timeZone: DEFAULT_TIME_ZONE,
    messages: getMessages(locale),
    onError: handleIntlError,
  }) as unknown as Translator;
}
