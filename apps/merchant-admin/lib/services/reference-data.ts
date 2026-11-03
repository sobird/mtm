import { prisma } from '@/lib/db';

import { AppError } from '../errors';

export async function getReferenceData<T>(key: string): Promise<T> {
  const row = await prisma.referenceData.findUnique({ where: { key } });

  if (!row) {
    throw new AppError('NOT_FOUND', 404, '数据不存在');
  }

  return row.payload as T;
}
