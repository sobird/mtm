import { withAuth } from '@/lib/handler';
import { getMenuBadges } from '@/lib/services/menu';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async () => getMenuBadges());
