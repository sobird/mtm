export const LOCALE_COOKIE = 'NEXT_LOCALE';
export const DEFAULT_LOCALE = 'zh-CN';
export const DEFAULT_TIME_ZONE = 'Asia/Shanghai';
export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function normalizeLocale(value: string | null | undefined): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value ?? '') ? (value as Locale) : DEFAULT_LOCALE;
}
