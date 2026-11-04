import { DEFAULT_LOCALE, createTranslator, type Translate } from '@mtm/i18n';
import { z } from 'zod';

import { isMobilePhone } from './phone';

/** Supported international calling codes, mirroring the legacy login form. */
export const INTER_CODES = ['86', '65', '852', '853'] as const;

/**
 * Select options for the calling code picker (single source for both forms).
 * The labels are translated with the caller's translator.
 */
export function createInterCodeOptions(t: Translate) {
  return [
    { value: '86', label: t('auth.interCode.cn') },
    { value: '65', label: t('auth.interCode.sg') },
    { value: '852', label: t('auth.interCode.hk') },
    { value: '853', label: t('auth.interCode.mo') },
  ];
}

export function createLoginSchema(t: Translate) {
  return z
    .object({
      interCode: z.enum(INTER_CODES),
      mobile: z.string().min(1, t('validation.mobileRequired')),
      captcha: z.string().min(1, t('validation.captchaRequired')),
    })
    .superRefine((value, ctx) => {
      if (value.mobile && !isMobilePhone(value.mobile, value.interCode)) {
        ctx.addIssue({ code: 'custom', message: t('validation.mobileFormat'), path: ['mobile'] });
      }
    });
}

/** Username-or-phone + password login (merchant portal). */
export function createPasswordLoginSchema(t: Translate) {
  return z.object({
    identifier: z.string().trim().min(1, t('validation.identifierRequired')),
    password: z.string().min(1, t('validation.passwordRequired')),
  });
}

export function createRegisterSchema(t: Translate) {
  return createLoginSchema(t).extend({
    policy: z.literal(true, { error: t('validation.policyRequired') }),
  });
}

// Server-side defaults for flows that do not render validation text (the
// credentials `authorize` callback, for example). User-facing forms build a
// schema from the active locale instead.
const defaultTranslate = createTranslator(DEFAULT_LOCALE);

export const loginSchema = createLoginSchema(defaultTranslate);

export const passwordLoginSchema = createPasswordLoginSchema(defaultTranslate);

export const registerSchema = createRegisterSchema(defaultTranslate);

export const INTER_CODE_OPTIONS = createInterCodeOptions(defaultTranslate);

export type LoginValues = z.output<ReturnType<typeof createLoginSchema>>;

export type PasswordLoginValues = z.output<ReturnType<typeof createPasswordLoginSchema>>;

export type RegisterValues = z.output<ReturnType<typeof createRegisterSchema>>;

/**
 * Returns an in-app path for post-login navigation, guarding against open
 * redirects. Only paths starting with a single `/` (and not `//` or `/\`) are
 * allowed; anything else falls back to the admin home page.
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
