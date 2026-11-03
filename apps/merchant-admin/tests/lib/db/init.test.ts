import { afterAll, expect, test } from 'vitest';

const { prisma, initDatabase } = await import('@/lib/db');
const { CORE_SEED_VERSION } = await import('@/lib/db/seed');

afterAll(() => prisma.$disconnect());

test('initDatabase is idempotent', async () => {
  await initDatabase();
  await initDatabase();
  expect(await prisma.seedMeta.count({ where: { version: CORE_SEED_VERSION } })).toBe(1);
  const rows = await prisma.$queryRaw`SELECT 1 AS ok`;
  expect(rows).toBeTruthy();
});
