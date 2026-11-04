import { prisma } from '@/lib/db/client';
import type { OpsAccount, OpsLoginLog } from '@/lib/generated/prisma';

/**
 * Minimal account lookups used by authentication. Account/role management is
 * intentionally not implemented here yet (Task 10 extends this module).
 */
export function findOpsAccountByUsername(username: string): Promise<OpsAccount | null> {
  return prisma.opsAccount.findUnique({ where: { username } });
}

export function recordOpsLogin(accountId: string, success: boolean): Promise<OpsLoginLog> {
  return prisma.opsLoginLog.create({
    data: { accountId, ip: null, userAgent: null, success },
  });
}

export function markOpsAccountLogin(accountId: string): Promise<OpsAccount> {
  return prisma.opsAccount.update({
    where: { id: accountId },
    data: { lastLoginAt: new Date() },
  });
}
