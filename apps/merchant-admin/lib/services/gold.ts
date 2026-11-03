import { prisma } from '@/lib/db';

import { AppError } from '../errors';

export interface GoldStandardDTO {
  key: string;
  name: string;
  desc: string;
  progress: string;
  url: string;
  qualified: number;
}

export interface GoldDTO {
  lastPeriodStatus: number;
  currentPeriodSTime: string;
  currentPeriodETime: string;
  standards: GoldStandardDTO[];
}

/**
 * Returns the demo gold-merchant period with its standards. `poiId` and
 * `periodType` are accepted for API-shape compatibility; the seed holds a
 * single period.
 */
export async function getGold(poiId: number, periodType: number): Promise<GoldDTO> {
  void poiId;
  void periodType;

  const period = await prisma.goldPeriod.findFirst({ orderBy: { id: 'asc' } });

  if (!period) {
    throw new AppError('NOT_FOUND', 404, '金牌商家数据不存在');
  }

  const rows = await prisma.goldStandard.findMany({ where: { periodId: period.id } });

  const standards: GoldStandardDTO[] = [];
  for (const row of rows) {
    standards.push({
      key: row.key,
      name: row.name ?? '',
      desc: row.desc ?? '',
      progress: row.progress ?? '',
      url: row.url ?? '',
      qualified: row.qualified ?? 0,
    });
  }

  return {
    lastPeriodStatus: period.lastPeriodStatus ?? 0,
    currentPeriodSTime: period.currentPeriodSTime ?? '',
    currentPeriodETime: period.currentPeriodETime ?? '',
    standards,
  };
}
