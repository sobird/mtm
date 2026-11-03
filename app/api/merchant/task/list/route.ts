import { z } from 'zod';

import { parseQuery, withAuth } from '@/lib/handler';
import { listMerchantTasks } from '@/lib/services/merchant-task';

export const dynamic = 'force-dynamic';

const taskQuerySchema = z.object({
  poiId: z.coerce.number().int().optional(),
});

export const GET = withAuth(async ({ request }) => {
  const { poiId } = parseQuery(request, taskQuerySchema);

  return listMerchantTasks(poiId ?? 1);
});
