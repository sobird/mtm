import { verifyPassword } from '@mtm/auth/password';
import { DEMO_MERCHANT_ID, MERCHANT_PERMISSIONS } from '@mtm/contracts';
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
