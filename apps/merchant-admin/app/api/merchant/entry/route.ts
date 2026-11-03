import { z } from 'zod';

import { SEED_MERCHANT_ID } from '@/lib/db/seed/ids';
import { parseBody, parseQuery, withPublic } from '@/lib/handler';
import { getEntry, updateEntry } from '@/lib/services/entry';

export const dynamic = 'force-dynamic';

const entryQuerySchema = z.object({
  entryTaskId: z.coerce.number().int().optional(),
});

const entryUpdateSchema = z.record(z.string(), z.unknown());

export const GET = withPublic(async ({ request }) => {
  const { entryTaskId } = parseQuery(request, entryQuerySchema);

  return getEntry(SEED_MERCHANT_ID, entryTaskId);
});

export const PATCH = withPublic(async ({ request }) => {
  const body = await parseBody(request, entryUpdateSchema);

  return updateEntry(SEED_MERCHANT_ID, body);
});
