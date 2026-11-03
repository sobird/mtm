import { afterAll, expect, test } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

const { sequelize, initDatabase } = await import('@/lib/db');
const { SeedMeta } = await import('@/lib/db/models');

afterAll(async () => {
  await sequelize.close();
});

test('initDatabase is idempotent', async () => {
  await initDatabase();
  await initDatabase();
  expect(await SeedMeta.findOne({ where: { version: 'bootstrap' } })).not.toBeNull();
  const [rows] = await sequelize.query('SELECT 1 AS ok');
  expect(rows).toBeTruthy();
});
