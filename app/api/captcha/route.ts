import { cookies } from 'next/headers';

import { fail, ok } from '@/lib/api-response';
import { AppError } from '@/lib/errors';
import { createCaptcha } from '@/lib/services/captcha';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const mobile = body?.mobile == null ? '' : String(body.mobile);

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
    secure: process.env.NODE_ENV === 'production',
  });

  return ok({ mobile: Number(mobile), captcha: display.captcha });
}
