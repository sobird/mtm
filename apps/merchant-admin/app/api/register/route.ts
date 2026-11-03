import { cookies } from 'next/headers';
import { z } from 'zod';

import { AppError } from '@/lib/errors';
import { parseBody, withPublic } from '@/lib/handler';
import { verifyCaptcha } from '@/lib/services/captcha';
import { register } from '@/lib/services/registration';
import { isMobilePhone } from '@/lib/validation/phone';

export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  interCode: z.string().min(1),
  mobile: z.string().min(1),
  captcha: z.string().min(1).optional(),
});

export const POST = withPublic(async ({ request }) => {
  const body = await parseBody(request, registerSchema);

  if (!isMobilePhone(body.mobile, body.interCode)) {
    throw new AppError('INVALID_MOBILE', 400, '手机号格式不正确');
  }

  if (body.captcha !== undefined) {
    const store = await cookies();
    const token = store.get('mtm_captcha')?.value;
    const valid = await verifyCaptcha(token, body.captcha);

    if (!valid) {
      throw new AppError('INVALID_CAPTCHA', 400, '验证码不正确');
    }
  }

  await register(body);

  return null;
});
