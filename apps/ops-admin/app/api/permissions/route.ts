import { PERMISSIONS } from '@mtm/contracts';

import { withPermission } from '@/lib/handler';
import { listPermissions } from '@/lib/services/role-admin';

export const GET = withPermission(PERMISSIONS.ROLE_MANAGE, async () => listPermissions());
