import { withPublic } from '@/lib/handler';
import { getMerchantOptions } from '@/lib/services/merchant';

export const dynamic = 'force-dynamic';

export const GET = withPublic(async () => getMerchantOptions());
