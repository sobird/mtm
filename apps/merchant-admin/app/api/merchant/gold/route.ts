import { z } from 'zod';

import { parseQuery, withAuth } from '@/lib/handler';
import { getGold } from '@/lib/services/gold';

export const dynamic = 'force-dynamic';

/** `poild` tolerates the legacy client typo alongside the canonical `poiId`. */
const goldQuerySchema = z.object({
  poiId: z.coerce.number().int().optional(),
  poild: z.coerce.number().int().optional(),
  periodType: z.coerce.number().int().optional(),
});

export const GET = withAuth(async ({ request }) => {
  const { poiId, poild, periodType } = parseQuery(request, goldQuerySchema);

  return getGold(poiId ?? poild ?? 1, periodType ?? 0);
});
