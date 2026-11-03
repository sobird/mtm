import { Violation } from '@/lib/db/models';

import { AppError } from '../errors';

export interface ViolationOverviewDTO {
  issueCount: number;
  appealCount: number;
  ticketAmount: number;
}

export async function getViolationOverview(): Promise<ViolationOverviewDTO> {
  const row = await Violation.findOne({ order: [['id', 'ASC']] });

  if (!row) {
    throw new AppError('NOT_FOUND', 404, '违规数据不存在');
  }

  return {
    issueCount: row.issueCount ?? 0,
    appealCount: row.appealCount ?? 0,
    ticketAmount: row.ticketAmount ?? 0,
  };
}
