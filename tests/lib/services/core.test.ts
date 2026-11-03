import { afterAll, expect, test } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

const { sequelize, initDatabase } = await import('@/lib/db');
const { getMenu, updateMenuFavorites, getMenuBadges } = await import('@/lib/services/menu');
const { getMerchant, listLicenses } = await import('@/lib/services/merchant');
const { getEntry } = await import('@/lib/services/entry');

afterAll(async () => {
  await sequelize.close();
});

test('menu tree marks the last root item', async () => {
  await initDatabase();
  const { menuItems, favorites } = await getMenu(1);
  expect(menuItems.length).toBeGreaterThan(0);
  expect(menuItems.at(-1)?.last).toBe(true);
  expect(favorites).toHaveLength(10);
});

test('rejects an 11th favorite', async () => {
  const eleven = Array.from({ length: 11 }, (_, i) => ({ id: String(i + 1) }));
  await expect(updateMenuFavorites(1, eleven)).rejects.toMatchObject({ code: 'MAX_FAVORITES' });
});

test('returns merchant detail', async () => {
  const merchant = await getMerchant(1);
  expect(merchant.id).toBe(123456);
});

test('returns seeded menu badges, licenses, and entry', async () => {
  const badges = await getMenuBadges();
  expect(badges).toHaveLength(18);

  const licenses = await listLicenses(1);
  expect(licenses).toHaveLength(1);

  const entry = await getEntry(1);
  expect(entry.merchantId).toBe(1);
  expect(entry.payload).toBeUndefined();
  expect(entry.entryTaskId).toBe(82025);
});
