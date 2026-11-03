import { prisma } from '@/lib/db/client';
import type { Prisma } from '@/lib/generated/prisma';

export interface WriteOperationLogInput {
  accountId: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  detail?: Prisma.InputJsonValue | null;
}

/** Records an operator action in the ops audit log. */
export async function writeOperationLog(input: WriteOperationLogInput): Promise<void> {
  await prisma.opsOperationLog.create({
    data: {
      accountId: input.accountId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      detail: input.detail ?? undefined,
    },
  });
}
