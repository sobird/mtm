import { afterAll, expect, test } from 'vitest';

const { prisma, initDatabase } = await import('@/lib/db');
const { seedDatabase } = await import('@/lib/db/seed');
const { dataOf } = await import('@/lib/db/seed/transformers');
import merchantOptionsGet from '@/lib/db/seed/data/main/merchant/options/get.json';

afterAll(() => prisma.$disconnect());

test('seeds the same counts twice', async () => {
  await initDatabase();
  const before = {
    menu: await prisma.menuItem.count(),
    categories: await prisma.merchantCategory.count(),
    favorites: await prisma.menuFavorite.count(),
  };
  await seedDatabase();
  expect(await prisma.menuItem.count()).toBe(before.menu);
  expect(await prisma.merchantCategory.count()).toBe(before.categories);
  expect(await prisma.menuFavorite.count()).toBe(before.favorites);
  expect(before).toEqual({ menu: 57, categories: 173, favorites: 10 });
});

test('round-trips the 117KB merchant options JSON', async () => {
  await initDatabase();
  const row = await prisma.referenceData.findUniqueOrThrow({ where: { key: 'merchant-options' } });
  expect(row.payload).toEqual(dataOf(merchantOptionsGet));
});
