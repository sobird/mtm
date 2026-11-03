import { AppError } from '@/lib/errors';
import { withPublic } from '@/lib/handler';
import { upload } from '@/lib/services/venus';

export const dynamic = 'force-dynamic';

export const POST = withPublic(async ({ request }) => {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    throw new AppError('INVALID_BODY', 400, '请求体不合法');
  }

  return upload(formData);
});
