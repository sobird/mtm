import { z } from 'zod';

import { parseQuery, withAuth } from '@/lib/handler';
import { getSellingProduct } from '@/lib/services/product';

export const dynamic = 'force-dynamic';

const productQuerySchema = z.object({
  poiId: z.coerce.number().int().optional(),
});

export const GET = withAuth(async ({ request }) => {
  const { poiId } = parseQuery(request, productQuerySchema);

  return getSellingProduct(poiId);
});
