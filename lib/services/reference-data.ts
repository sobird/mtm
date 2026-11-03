import { ReferenceData } from '@/lib/db/models';

import { AppError } from '../errors';

export async function getReferenceData<T>(key: string): Promise<T> {
  const row = await ReferenceData.findByPk(key);

  if (!row) {
    throw new AppError('NOT_FOUND', 404, '数据不存在');
  }

  return row.payload as T;
}
