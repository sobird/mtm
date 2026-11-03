import { withAuth } from '@/lib/handler';
import { listLicenses } from '@/lib/services/merchant';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async ({ merchantId }) => listLicenses(merchantId));
