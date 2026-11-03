import { z } from 'zod';

import { parseQuery, withAuth } from '@/lib/handler';
import { getWorkbench } from '@/lib/services/analysis';

export const dynamic = 'force-dynamic';

const analysisQuerySchema = z.object({
  poiId: z.coerce.number().int().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const GET = withAuth(async ({ request }) => {
  parseQuery(request, analysisQuerySchema);

  return getWorkbench();
});
