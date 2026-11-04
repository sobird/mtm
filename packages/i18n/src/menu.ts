import type { Translator } from './messages';

export function translateUiKey(value: string, t: Translator): string {
  return value.startsWith('menu.') && t.has(value) ? t(value) : value;
}
