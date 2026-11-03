import { withAuth } from '@/lib/handler';
import { getAccount } from '@/lib/services/account';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async ({ accountId }) => getAccount(accountId));
