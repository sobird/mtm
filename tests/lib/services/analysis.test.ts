import { afterAll, expect, test } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

const { sequelize, initDatabase } = await import('@/lib/db');
const { getWorkbench } = await import('@/lib/services/analysis');

afterAll(async () => {
  await sequelize.close();
});

test('workbench exposes overview and realdata', async () => {
  await initDatabase();
  const res = await getWorkbench();
  expect(res.overview.unpaidOrderCount).toBeTypeOf('number');
  expect(res.realdata.paidOrderCount).toBeTypeOf('number');
});
