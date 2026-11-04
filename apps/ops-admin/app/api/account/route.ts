import { withAuth } from '@/lib/handler';

export const GET = withAuth(async ({ accountId, username, name }) => ({ accountId, username, name }));
