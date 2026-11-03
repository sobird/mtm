import { z } from 'zod';

import { parseBody, withPublic } from '@/lib/handler';
import { sign } from '@/lib/services/venus';

export const dynamic = 'force-dynamic';

const signSchema = z.object({
  contractId: z.string().min(1),
});

export const POST = withPublic(async ({ request }) => {
  const body = await parseBody(request, signSchema);

  return sign(body);
});
