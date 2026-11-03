import { z } from 'zod';

import { isMobilePhone } from './phone';

/** Supported international calling codes, mirroring the legacy login form. */
export const INTER_CODES = ['86', '65', '852', '853'] as const;

/** Select options for the calling code picker (single source for both forms). */
export const INTER_CODE_OPTIONS = [
  { value: '86', label: '+86(中国)' },
  { value: '65', label: '+65(新加坡)' },
  { value: '852', label: '+852(中国香港)' },
  { value: '853', label: '+853(中国澳门)' },
];

export const loginSchema = z
  .object({
    interCode: z.enum(INTER_CODES),
    mobile: z.string().min(1, '手机号不能为空'),
    captcha: z.string().min(1, '验证码不能为空'),
  })
  .superRefine((value, ctx) => {
    if (value.mobile && !isMobilePhone(value.mobile, value.interCode)) {
      ctx.addIssue({ code: 'custom', message: '手机号格式不符合要求', path: ['mobile'] });
    }
  });

/** Username-or-phone + password login (merchant portal). */
export const passwordLoginSchema = z.object({
  identifier: z.string().trim().min(1, '请输入用户名或手机号'),
  password: z.string().min(1, '密码不能为空'),
});

export const registerSchema = loginSchema.extend({
  policy: z.literal(true, { error: '请勾选隐私协议' }),
});

export type LoginValues = z.output<typeof loginSchema>;

export type PasswordLoginValues = z.output<typeof passwordLoginSchema>;

export type RegisterValues = z.output<typeof registerSchema>;

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
