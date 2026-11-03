import { PERMISSIONS } from '@mtm/contracts';

import { prisma } from '@/lib/db/client';

export interface PermissionSnapshot {
  codes: string[];
  set: Set<string>;
  isCrossTenant: boolean;
  merchantScope: string[] | null;
}

/**
 * Resolves every permission code and merchant scope granted to an account.
 *
 * An unknown account yields an empty snapshot so callers can treat missing
 * accounts exactly like accounts without roles.
 */
export async function getAccountPermissions(accountId: string): Promise<PermissionSnapshot> {
  const account = await prisma.opsAccount.findUnique({
    where: { id: accountId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
              merchantScopes: true,
            },
          },
        },
      },
    },
  });

  if (!account) {
    return { codes: [], set: new Set(), isCrossTenant: false, merchantScope: [] };
  }

  const codes = new Set<string>();
  const merchantIds = new Set<string>();

  for (const accountRole of account.roles) {
    for (const rolePermission of accountRole.role.permissions) {
      codes.add(rolePermission.permission.code);
    }
    for (const scope of accountRole.role.merchantScopes) {
      merchantIds.add(scope.merchantId);
    }
  }

  const sortedCodes = [...codes].sort();
  const isCrossTenant = sortedCodes.includes(PERMISSIONS.PLATFORM_CROSS_TENANT);

  return {
    codes: sortedCodes,
    set: new Set(sortedCodes),
    isCrossTenant,
    merchantScope: isCrossTenant ? null : [...merchantIds].sort(),
  };
}
