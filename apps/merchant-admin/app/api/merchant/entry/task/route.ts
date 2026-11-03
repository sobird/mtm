import { withPublic } from '@/lib/handler';
import { getEntryTask } from '@/lib/services/entry';

export const dynamic = 'force-dynamic';

export const GET = withPublic(async () => getEntryTask(1));
