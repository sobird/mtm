import { withAuth } from '@/lib/handler';
import { getMenu } from '@/lib/services/menu';

export const GET = withAuth(async ({ accountId }) => getMenu(accountId));
