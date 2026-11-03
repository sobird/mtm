import { z } from 'zod';

import { parseBody, withAuth } from '@/lib/handler';
import { getMenu, updateMenuFavorites } from '@/lib/services/menu';

export const dynamic = 'force-dynamic';

const favoritesSchema = z.object({
  favorites: z.array(z.object({ id: z.string() })),
});

export const GET = withAuth(async ({ accountId }) => getMenu(accountId));

export const PATCH = withAuth(async ({ accountId, request }) => {
  const { favorites } = await parseBody(request, favoritesSchema);

  return updateMenuFavorites(accountId, favorites);
});
