import { parseQuery, withAuth } from '@/lib/handler';
import { listMerchants } from '@/lib/services/merchant';
import { paginationSchema } from '@/lib/validation/common';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async ({ request }) => listMerchants(parseQuery(request, paginationSchema)));
