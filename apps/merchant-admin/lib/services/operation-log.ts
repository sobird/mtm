import { prisma } from '@/lib/db/client';
import type { Prisma } from '@/lib/generated/prisma';

export interface WriteOperationLogInput {
  accountId: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  detail?: Prisma.InputJsonValue | null;
}

type OperationLogClient = Prisma.TransactionClient | typeof prisma;

/**
 * Records an operator action in the merchant audit log.
 *
 * Pass `tx` when calling inside a `prisma.$transaction` so the audit row
 * commits or rolls back together with the data change.
 */
export async function writeOperationLog(
  input: WriteOperationLogInput,
  client: OperationLogClient = prisma
): Promise<void> {
  await client.merchantOperationLog.create({
    data: {
      accountId: input.accountId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      detail: input.detail ?? undefined,
    },
  });
}
