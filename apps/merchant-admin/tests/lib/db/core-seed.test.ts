import { afterAll, expect, test } from 'vitest';

const { prisma, initDatabase } = await import('@/lib/db');
const { CORE_SEED_VERSION } = await import('@/lib/db/seed');

afterAll(() => prisma.$disconnect());

test('seeds core entities exactly once', async () => {
  await initDatabase();
  await initDatabase();
  expect(await prisma.menuItem.count()).toBe(54);
  expect(await prisma.menuFavorite.count()).toBe(10);
  expect(await prisma.merchantCategory.count()).toBe(173);
  const account = await prisma.merchantAccount.findFirst({ where: { phone: '13412345678' } });
  expect(account?.interCode).toBe('86');
  expect(await prisma.seedMeta.count({ where: { version: CORE_SEED_VERSION } })).toBe(1);
});
