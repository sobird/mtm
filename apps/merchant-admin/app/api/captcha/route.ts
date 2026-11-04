import { useSecureCookies } from '@mtm/auth/cookies';
import { cookies } from 'next/headers';

import { fail, ok } from '@/lib/api-response';
import { AppError } from '@/lib/errors';
import { createCaptcha } from '@/lib/services/captcha';

export const dynamic = 'force-dynamic';

async function issueCaptcha(mobile: string) {
  if (!mobile) {
    return fail(new AppError('INVALID_MOBILE', 400, '手机号不能为空'));
  }

  const { token, display } = await createCaptcha(mobile);
  const store = await cookies();

  store.set('mtm_captcha', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 300,
    secure: useSecureCookies(),
  });

  return ok({ mobile: Number(mobile), captcha: display.captcha });
}

/** Legacy clients call `GET /captcha?mobile=...`; keep POST for JSON callers. */
export async function GET(request: Request) {
  const mobile = new URL(request.url).searchParams.get('mobile') ?? '';

  return issueCaptcha(mobile);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const mobile = body?.mobile == null ? '' : String(body.mobile);

  return issueCaptcha(mobile);
}
