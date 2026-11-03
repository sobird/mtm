import { afterAll, expect, test } from 'vitest';

const { prisma, initDatabase } = await import('@/lib/db');
const { getWorkbench } = await import('@/lib/services/analysis');

afterAll(() => prisma.$disconnect());

test('workbench exposes overview and realdata', async () => {
  await initDatabase();
  const res = await getWorkbench();
  expect(res.overview.unpaidOrderCount).toBeTypeOf('number');
  expect(res.overview.delayedDeliverOrderCount).toBeTypeOf('number');
  expect(res.realdata.paidOrderCount).toBeTypeOf('number');
});
