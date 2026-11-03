import { z } from 'zod';

import { parseQuery, withPublic } from '@/lib/handler';
import { getCategories } from '@/lib/services/merchant';

export const dynamic = 'force-dynamic';

const categoryQuerySchema = z.object({
  parentId: z.coerce.number().int().optional(),
});

export const GET = withPublic(async ({ request }) => {
  const { parentId } = parseQuery(request, categoryQuerySchema);

  return getCategories(parentId);
});
