import { DEFAULT_LOCALE, createTranslator, type Translate } from '@mtm/i18n';
import { z } from 'zod';

export function createLoginSchema(t: Translate) {
  return z.object({
    username: z.string().min(1, t('validation.usernameRequired')),
    password: z.string().min(1, t('validation.passwordRequired')),
  });
}

// The credentials `authorize` callback does not render validation text, so it
// uses the default-locale schema. Forms build one from the active locale.
const defaultTranslate = createTranslator(DEFAULT_LOCALE);

export const loginSchema = createLoginSchema(defaultTranslate);

export type LoginValues = z.output<typeof loginSchema>;

/**
 * Returns an in-app path for post-login navigation, guarding against open
 * redirects. Only paths starting with a single `/` (and not `//` or `/\`) are
 * allowed; anything else falls back to the ops home page.
 */
export function safeCallbackUrl(input?: unknown): string {
  // Next.js may hand back `string[]` for a repeated query param.
  if (typeof input !== 'string' || !input.startsWith('/')) {
    return '/';
  }

  if (input.startsWith('//') || input.startsWith('/\\')) {
    return '/';
  }

  return input;
}
