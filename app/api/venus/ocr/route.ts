import { z } from 'zod';

import { parseBody, withPublic } from '@/lib/handler';
import { ocr } from '@/lib/services/venus';

export const dynamic = 'force-dynamic';

const ocrSchema = z.object({
  image: z.string(),
  type: z.coerce.number().int().optional(),
});

export const POST = withPublic(async ({ request }) => {
  const body = await parseBody(request, ocrSchema);

  return ocr(body);
});
