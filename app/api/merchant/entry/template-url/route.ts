import { z } from 'zod';

import { parseQuery, withPublic } from '@/lib/handler';
import { getEntryTemplateUrl } from '@/lib/services/entry';

export const dynamic = 'force-dynamic';

const templateUrlQuerySchema = z.object({
  type: z.string().min(1),
});

export const GET = withPublic(async ({ request }) => {
  const { type } = parseQuery(request, templateUrlQuerySchema);

  return getEntryTemplateUrl(type);
});
