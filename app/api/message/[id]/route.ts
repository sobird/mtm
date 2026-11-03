import { withAuth } from '@/lib/handler';
import { getMessage } from '@/lib/services/message';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async ({ params }) => getMessage(params.id));
