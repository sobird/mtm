import { withAuth } from '@/lib/handler';
import { getLatestMessages } from '@/lib/services/message';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async () => getLatestMessages());
