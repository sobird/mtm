import type { ServiceTokenClaims } from '@mtm/auth/service-token';

import type { Prisma } from '../generated/prisma';

export type CoreOperationLogInput = {
  action: string;
  resource: 'product' | 'audit';
  resourceId?: string | null;
  detail?: Prisma.InputJsonValue;
};

/**
 * Writes a core operation log inside the caller's transaction. Callers must
 * pass the transaction client so the log rolls back together with the business
 * change it records (fail-closed).
 */
export async function recordCoreOperationLog(
  tx: Prisma.TransactionClient,
  auth: ServiceTokenClaims,
  input: CoreOperationLogInput
): Promise<void> {
  await tx.coreOperationLog.create({
    data: {
      portal: auth.portal,
      actorId: auth.userId,
      actorMerchantId: auth.merchantId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      detail: input.detail ?? undefined,
    },
  });
}
