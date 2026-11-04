import { afterAll, expect, test } from 'vitest';

const { prisma, initDatabase } = await import('@/lib/db');
const { CORE_SEED_VERSION, seedCore } = await import('@/lib/db/seed');
const { toMenuTitleKey } = await import('@/lib/db/seed/menu-i18n');

afterAll(() => prisma.$disconnect());

test('seeds core entities exactly once', async () => {
  await initDatabase();
  await initDatabase();
  expect(await prisma.menuItem.count()).toBe(57);
  expect(await prisma.menuFavorite.count()).toBe(10);
  expect(await prisma.merchantCategory.count()).toBe(173);
  const account = await prisma.merchantAccount.findFirst({ where: { phone: '13412345678' } });
  expect(account?.interCode).toBe('86');
  expect(await prisma.seedMeta.count({ where: { version: CORE_SEED_VERSION } })).toBe(1);
});

test('seedCore refreshes existing Chinese menu rows to i18n keys', async () => {
  await initDatabase();

  await prisma.menuItem.update({ where: { id: '1382' }, data: { title: '商品管理' } });
  await prisma.menuBadge.upsert({
    where: { menuId: '1401' },
    create: { menuId: '1401', noticeStyle: 30, noticeContent: '新' },
    update: { noticeStyle: 30, noticeContent: '新' },
  });

  await seedCore();

  const menuItem = await prisma.menuItem.findUniqueOrThrow({ where: { id: '1382' } });
  expect(menuItem.title).toBe('menu.product.group');

  const badge = await prisma.menuBadge.findUniqueOrThrow({ where: { menuId: '1401' } });
  expect(badge.noticeContent).toBe('menu.badge.new');
});

test('toMenuTitleKey rejects unmapped titles', () => {
  expect(() => toMenuTitleKey('未知标题')).toThrow(/未映射的菜单标题/);
});
