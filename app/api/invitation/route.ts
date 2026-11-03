import { z } from 'zod';

import { parseBody, withPublic } from '@/lib/handler';
import { acceptInvitation } from '@/lib/services/registration';

export const dynamic = 'force-dynamic';

const invitationSchema = z.object({
  code: z.string().min(1),
});

export const POST = withPublic(async ({ request }) => {
  const { code } = await parseBody(request, invitationSchema);
  await acceptInvitation(code);

  return null;
});
