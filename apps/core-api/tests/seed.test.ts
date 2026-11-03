import { beforeEach, expect, test } from 'vitest';

import { seedCoreData, CORE_DATA_SEED_VERSION } from '@/prisma/seed-data';
import { prisma } from '@/src/db';

import { resetCoreFixtures } from './helpers';

beforeEach(resetCoreFixtures);

test('种子数据可重复执行且数量稳定', async () => {
  await seedCoreData(prisma);
  await seedCoreData(prisma);

  expect(await prisma.merchant.count()).toBe(3);
  expect(await prisma.shop.count()).toBe(4);
  expect(await prisma.category.count()).toBe(23);
  expect(await prisma.brand.count()).toBe(10);
  expect(await prisma.seedMeta.count({ where: { version: CORE_DATA_SEED_VERSION } })).toBe(1);

  const merchant = await prisma.merchant.findUniqueOrThrow({
    where: { id: 'merchant-demo-1' },
    include: { shops: true },
  });
  expect(merchant.code).toBe('M1001');
  expect(merchant.shops).toHaveLength(2);
});

test('类目最多三级且路径由 ID 组成', async () => {
  await seedCoreData(prisma);
  const levels = await prisma.category.groupBy({ by: ['level'], _count: true });
  expect(levels.map(item => item.level).sort()).toEqual([1, 2, 3]);
  const leaf = await prisma.category.findFirstOrThrow({ where: { level: 3 } });
  expect(leaf.path.startsWith('/')).toBe(true);
});
