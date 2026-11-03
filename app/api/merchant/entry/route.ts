import { z } from 'zod';

import { parseBody, parseQuery, withPublic } from '@/lib/handler';
import { getEntry, updateEntry } from '@/lib/services/entry';

export const dynamic = 'force-dynamic';

const entryQuerySchema = z.object({
  entryTaskId: z.coerce.number().int().optional(),
});

const entryUpdateSchema = z.record(z.string(), z.unknown());

export const GET = withPublic(async ({ request }) => {
  const { entryTaskId } = parseQuery(request, entryQuerySchema);

  return getEntry(1, entryTaskId);
});

export const PATCH = withPublic(async ({ request }) => {
  const body = await parseBody(request, entryUpdateSchema);

  return updateEntry(1, body);
});
