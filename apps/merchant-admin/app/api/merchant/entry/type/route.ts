import { withPublic } from '@/lib/handler';
import { getEntryTypes } from '@/lib/services/entry';

export const dynamic = 'force-dynamic';

export const GET = withPublic(async () => getEntryTypes());
