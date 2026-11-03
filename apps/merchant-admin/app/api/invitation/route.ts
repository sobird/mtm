import { z } from 'zod';

import { parseBody, withPublic } from '@/lib/handler';
import { acceptInvitation } from '@/lib/services/registration';

export const dynamic = 'force-dynamic';

// The legacy onboarding form treats the code as optional and may send a number.
const invitationSchema = z.object({
  code: z.union([z.string(), z.number()]).optional(),
});

export const POST = withPublic(async ({ request }) => {
  const { code } = await parseBody(request, invitationSchema);
  const normalized = code === undefined ? '' : String(code).trim();

  if (normalized) {
    await acceptInvitation(normalized);
  }

  return null;
});
