import { MerchantTask } from '@/lib/db/models';

export interface MerchantTaskDTO {
  id: number;
  poiId: number;
  curTaskCount: number;
  curAwardCount: number;
}

/**
 * Returns the demo merchant tasks as an array. `poiId` is accepted for
 * API-shape compatibility; the seed holds a single task snapshot.
 */
export async function listMerchantTasks(poiId: number): Promise<MerchantTaskDTO[]> {
  void poiId;

  const rows = await MerchantTask.findAll({ order: [['id', 'ASC']] });

  const list: MerchantTaskDTO[] = [];
  for (const row of rows) {
    list.push({
      id: row.id,
      poiId: row.poiId,
      curTaskCount: row.curTaskCount ?? 0,
      curAwardCount: row.curAwardCount ?? 0,
    });
  }

  return list;
}
