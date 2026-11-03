import { prisma } from '@/lib/db';

import { AppError } from '../errors';

export interface PermissionSnapshot {
  codes: string[];
  set: Set<string>;
  isOwner: boolean;
}

/**
 * Resolves every permission code granted to a merchant account.
 *
 * Owners implicitly hold every merchant permission; staff only hold the codes
 * attached to their roles. Unknown accounts are reported as 404 so callers do
 * not silently continue with an empty snapshot.
 */
export async function getAccountPermissions(accountId: string): Promise<PermissionSnapshot> {
  const account = await prisma.merchantAccount.findUnique({
    where: { id: accountId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });

  if (!account) {
    throw new AppError('NOT_FOUND', 404, '账号不存在');
  }

  const codes = new Set<string>();

  if (account.isOwner) {
    const permissions = await prisma.merchantPermission.findMany({ select: { code: true } });

    for (const permission of permissions) {
      codes.add(permission.code);
    }
  } else {
    for (const accountRole of account.roles) {
      for (const rolePermission of accountRole.role.permissions) {
        codes.add(rolePermission.permission.code);
      }
    }
  }

  const sortedCodes = [...codes].sort();

  return {
    codes: sortedCodes,
    set: new Set(sortedCodes),
    isOwner: account.isOwner,
  };
}
