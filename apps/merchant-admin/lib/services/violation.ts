import { prisma } from '@/lib/db';

import { AppError } from '../errors';

export interface ViolationOverviewDTO {
  issueCount: number;
  appealCount: number;
  ticketAmount: number;
}

export async function getViolationOverview(): Promise<ViolationOverviewDTO> {
  const row = await prisma.violation.findFirst({ orderBy: { id: 'asc' } });

  if (!row) {
    throw new AppError('NOT_FOUND', 404, '违规数据不存在');
  }

  return {
    issueCount: row.issueCount ?? 0,
    appealCount: row.appealCount ?? 0,
    ticketAmount: row.ticketAmount ?? 0,
  };
}
