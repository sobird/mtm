import type { Translator } from './messages';

export function translateError(code: string | null | undefined, t: Translator): string {
  const key = `errors.${code ?? 'UNKNOWN'}`;
  return t.has(key) ? t(key) : t('errors.UNKNOWN');
}
