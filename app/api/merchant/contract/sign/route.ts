import { z } from 'zod';

import { parseBody, withAuth } from '@/lib/handler';
import { signContract } from '@/lib/services/merchant';

export const dynamic = 'force-dynamic';

const signContractSchema = z.object({
  name: z.string().min(1),
  idCard: z.string().min(1),
});

export const POST = withAuth(async ({ merchantId, request }) => {
  const body = await parseBody(request, signContractSchema);
  await signContract(merchantId, body);

  return null;
});
