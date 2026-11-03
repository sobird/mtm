import { afterAll, expect, test } from 'vitest';

const { prisma, initDatabase } = await import('@/lib/db');
const { SEED_ACCOUNT_ID, SEED_MERCHANT_ID, SEED_STAFF_ACCOUNT_ID } = await import('@/lib/db/seed/ids');
const { getMenu, updateMenuFavorites, getMenuBadges } = await import('@/lib/services/menu');
const { getMerchant, listLicenses } = await import('@/lib/services/merchant');
const { getEntry } = await import('@/lib/services/entry');

afterAll(() => prisma.$disconnect());

test('menu tree marks the last root item', async () => {
  await initDatabase();
  const { menuItems, favorites } = await getMenu(SEED_ACCOUNT_ID);
  expect(menuItems.length).toBeGreaterThan(0);
  expect(menuItems.at(-1)?.last).toBe(true);
  expect(favorites).toHaveLength(10);
});

test('staff menus and favorites hide account-management entries', async () => {
  await initDatabase();

  const ownerMenu = JSON.stringify(await getMenu(SEED_ACCOUNT_ID));
  expect(ownerMenu).toContain('/system/accounts');
  expect(ownerMenu).toContain('/system/roles');
  expect(ownerMenu).toContain('/staff/sub-account');

  // A favorite pointing at a menu the staff role cannot see must be filtered out.
  const hideFavorite = { accountId: SEED_STAFF_ACCOUNT_ID, menuId: 'seed-menu-accounts' };
  await prisma.menuFavorite.create({ data: { ...hideFavorite, sortIndex: 0 } });

  try {
    const { menuItems, favorites } = await getMenu(SEED_STAFF_ACCOUNT_ID);
    const serialized = JSON.stringify({ menuItems, favorites });

    expect(serialized).not.toContain('/system/accounts');
    expect(serialized).not.toContain('/system/roles');
    expect(serialized).not.toContain('/staff/sub-account');
    expect(favorites).toHaveLength(0);
  } finally {
    // Only remove the fixture row this test inserted; seeded rows stay intact.
    await prisma.menuFavorite.deleteMany({ where: hideFavorite });
  }
});

test('rejects an 11th favorite', async () => {
  const eleven = Array.from({ length: 11 }, (_, i) => ({ id: String(i + 1) }));
  await expect(updateMenuFavorites(SEED_ACCOUNT_ID, eleven)).rejects.toMatchObject({ code: 'MAX_FAVORITES' });
});

test('returns merchant detail', async () => {
  const merchant = await getMerchant(SEED_MERCHANT_ID);
  expect(merchant.id).toBe(123456);
});

test('returns seeded menu badges, licenses, and entry', async () => {
  const badges = await getMenuBadges();
  expect(badges).toHaveLength(18);

  const licenses = await listLicenses(SEED_MERCHANT_ID);
  expect(licenses).toHaveLength(1);

  const entry = await getEntry(SEED_MERCHANT_ID);
  expect(entry.merchantId).toBe(SEED_MERCHANT_ID);
  expect(entry.payload).toBeUndefined();
  expect(entry.entryTaskId).toBe('82025');
});
