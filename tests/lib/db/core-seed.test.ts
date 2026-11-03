import { afterAll, expect, test } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

const { sequelize, initDatabase } = await import('@/lib/db');
const { Account, MenuItem, MenuFavorite, MerchantCategory, SeedMeta } = await import('@/lib/db/models');

afterAll(async () => {
  await sequelize.close();
});

test('seeds core entities exactly once', async () => {
  await initDatabase();
  await initDatabase();
  expect(await MenuItem.count()).toBe(54);
  expect(await MenuFavorite.count()).toBe(10);
  expect(await MerchantCategory.count()).toBe(173);
  const account = await Account.findOne({ where: { mobile: '13412345678' } });
  expect(account?.interCode).toBe('86');
  expect(await SeedMeta.findOne({ where: { version: '2026-11-03-core' } })).not.toBeNull();
});
