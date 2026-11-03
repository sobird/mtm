import { z } from 'zod';

import { parseQuery, withAuth } from '@/lib/handler';
import { getViolationOverview } from '@/lib/services/violation';

export const dynamic = 'force-dynamic';

const violationQuerySchema = z.object({
  poiId: z.coerce.number().int().optional(),
});

export const GET = withAuth(async ({ request }) => {
  parseQuery(request, violationQuerySchema);

  return getViolationOverview();
});
