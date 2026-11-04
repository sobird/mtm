import { verifyPassword } from '@mtm/auth/password';
import { DEMO_MERCHANT_ID, MERCHANT_PERMISSIONS } from '@mtm/contracts';
import { DEFAULT_LOCALE, getMessages } from '@mtm/i18n';
import { afterAll, expect, test } from 'vitest';

import { prisma, initDatabase } from '@/lib/db';
import { seedMerchantAuth } from '@/lib/db/seed';
import { SEED_ACCOUNT_ID, SEED_MERCHANT_ID, SEED_STAFF_ACCOUNT_ID } from '@/lib/db/seed/ids';

afterAll(() => prisma.$disconnect());

test('re-running the auth seed corrects a drifted owner merchantId', async () => {
  await initDatabase();
  await prisma.merchantAccount.update({ where: { id: SEED_ACCOUNT_ID }, data: { merchantId: '1' } });

  await seedMerchantAuth(prisma);

  const owner = await prisma.merchantAccount.findUniqueOrThrow({ where: { id: SEED_ACCOUNT_ID } });
  expect(owner.merchantId).toBe(SEED_MERCHANT_ID);
});

test('seeds owner and staff accounts with scoped roles', async () => {
  await initDatabase();
  await initDatabase();

  const owner = await prisma.merchantAccount.findUniqueOrThrow({ where: { username: 'merchant@example.com' } });
  expect(owner.isOwner).toBe(true);
  expect(owner.merchantId).toBe(DEMO_MERCHANT_ID);
  expect(owner.phone).toBe('13412345678');
  await expect(verifyPassword(owner.passwordHash!, 'merchant123')).resolves.toBe(true);

  const staff = await prisma.merchantAccount.findUniqueOrThrow({
    where: { username: 'staff@example.com' },
    include: { roles: { include: { role: true } } },
  });
  expect(staff.id).toBe(SEED_STAFF_ACCOUNT_ID);
  expect(staff.isOwner).toBe(false);
  await expect(verifyPassword(staff.passwordHash!, 'staff123')).resolves.toBe(true);
  expect(staff.roles[0].role.code).toBe('staff');

  expect(await prisma.merchantPermission.count()).toBe(MERCHANT_PERMISSIONS.length);
  const roles = await prisma.merchantRole.findMany({ where: { merchantId: SEED_MERCHANT_ID } });
  expect(roles.map(role => role.code).sort()).toEqual(['owner', 'staff']);

  const accountMenus = await prisma.menuItem.findMany({ where: { permissionCode: 'account:manage' } });
  expect(accountMenus.map(item => item.url)).toEqual(
    expect.arrayContaining(['/system/accounts', '/staff/sub-account'])
  );

  // The permission seed owns the /shop/admin mapping; the menu update only
  // rewrites the sub-account menu.
  const shopAdminPermission = await prisma.merchantPermission.findFirst({ where: { path: '/shop/admin' } });
  expect(shopAdminPermission?.code).toBe('merchant:update');
});

test('商品菜单映射到新路由并挂上权限码', async () => {
  await initDatabase();
  await seedMerchantAuth(prisma);

  const products = await prisma.menuItem.findMany({ where: { id: { in: ['1382', '1383', '19245'] } } });
  const byId = new Map(products.map(item => [item.id, item]));

  expect(byId.get('1382')).toMatchObject({ url: '', title: 'menu.product.group', permissionCode: 'product:view' });
  expect(byId.get('1383')).toMatchObject({
    url: '/products',
    title: 'menu.product.list',
    permissionCode: 'product:view',
  });
  expect(byId.get('19245')).toMatchObject({
    url: '/products/new',
    title: 'menu.product.create',
    permissionCode: 'product:create',
  });
});

function messageKeys(value: object, prefix = ''): Set<string> {
  const keys = new Set<string>();
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'object' && child !== null) {
      for (const nested of messageKeys(child, `${prefix}${key}.`)) keys.add(nested);
    } else {
      keys.add(`${prefix}${key}`);
    }
  }
  return keys;
}

test('所有内置菜单标题都是已翻译的 i18n key', async () => {
  await initDatabase();
  await seedMerchantAuth(prisma);
  const keys = messageKeys(getMessages(DEFAULT_LOCALE));
  const rows = await prisma.menuItem.findMany();
  for (const row of rows) {
    const title = row.title ?? '';
    if (!title) continue;
    expect(title.startsWith('menu.')).toBe(true);
    expect(keys.has(title)).toBe(true);
  }
});

test('阶段 4 商品菜单使用 key', async () => {
  await initDatabase();
  await seedMerchantAuth(prisma);
  const rows = await prisma.menuItem.findMany({ where: { id: { in: ['1382', '1383', '19245'] } } });
  expect(new Map(rows.map(row => [row.id, row.title]))).toEqual(
    new Map([
      ['1382', 'menu.product.group'],
      ['1383', 'menu.product.list'],
      ['19245', 'menu.product.create'],
    ])
  );
});
