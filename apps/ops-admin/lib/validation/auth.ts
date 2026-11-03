import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

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
