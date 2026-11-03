import { z } from 'zod';

import { parseQuery, withAuth } from '@/lib/handler';
import { listCampaigns } from '@/lib/services/campaign';

export const dynamic = 'force-dynamic';

const campaignQuerySchema = z.object({
  pn: z.coerce.number().int().positive().optional(),
  ps: z.coerce.number().int().positive().max(100).optional(),
  type: z.string().optional(),
  applyStatus: z.coerce.number().int().optional(),
});

export const GET = withAuth(async ({ request }) => {
  const query = parseQuery(request, campaignQuerySchema);

  return listCampaigns(query);
});
