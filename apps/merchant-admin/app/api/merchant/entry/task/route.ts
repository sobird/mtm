import { SEED_MERCHANT_ID } from '@/lib/db/seed/ids';
import { withPublic } from '@/lib/handler';
import { getEntryTask } from '@/lib/services/entry';

export const dynamic = 'force-dynamic';

export const GET = withPublic(async () => getEntryTask(SEED_MERCHANT_ID));
