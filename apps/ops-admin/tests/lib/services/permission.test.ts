import { afterAll, expect, test } from 'vitest';

import { initDatabase } from '@/lib/db';
import { prisma } from '@/lib/db/client';
import { OPS_SEED_ADMIN_ID } from '@/lib/db/seed/ids';
import { getAccountPermissions } from '@/lib/services/permission';

async function removeFixtures(): Promise<void> {
  const accounts = await prisma.opsAccount.findMany({
    where: { username: { in: ['scoped-test-user', 'menu-limited'] } },
    select: { id: true },
  });
  const roles = await prisma.opsRole.findMany({ where: { code: 'scoped-test' }, select: { id: true } });
  const accountIds = accounts.map(account => account.id);
  const roleIds = roles.map(role => role.id);

  if (accountIds.length > 0) {
    await prisma.opsAccountRole.deleteMany({ where: { accountId: { in: accountIds } } });
  }
  if (roleIds.length > 0) {
    await prisma.opsRolePermission.deleteMany({ where: { roleId: { in: roleIds } } });
    await prisma.opsRoleMerchantScope.deleteMany({ where: { roleId: { in: roleIds } } });
  }
  if (accountIds.length > 0) {
    await prisma.opsAccount.deleteMany({ where: { id: { in: accountIds } } });
  }
  if (roleIds.length > 0) {
    await prisma.opsRole.deleteMany({ where: { id: { in: roleIds } } });
  }
}

afterAll(async () => {
  // Keep the Task 7 exact counts (1 role / seeded admin) valid for other files.
  await removeFixtures();
  await prisma.$disconnect();
});

test('super admin gets every permission and crosses tenants', async () => {
  await initDatabase();
  const snapshot = await getAccountPermissions(OPS_SEED_ADMIN_ID);
  expect(snapshot.codes).toHaveLength(10);
  expect(snapshot.isCrossTenant).toBe(true);
  expect(snapshot.merchantScope).toBeNull();
});

test('a scoped role only gets its permissions and merchant scope', async () => {
  await initDatabase();
  const permission = await prisma.opsPermission.findUniqueOrThrow({ where: { code: 'merchant:view' } });
  const role = await prisma.opsRole.create({
    data: {
      code: 'scoped-test',
      name: '受限角色',
      permissions: { create: [{ permissionId: permission.id }] },
      merchantScopes: { create: [{ merchantId: 'm1' }, { merchantId: 'm2' }] },
    },
  });
  const account = await prisma.opsAccount.create({
    data: {
      username: 'scoped-test-user',
      passwordHash: 'x',
      name: '受限账号',
      roles: { create: [{ roleId: role.id }] },
    },
  });

  const snapshot = await getAccountPermissions(account.id);
  expect(snapshot.codes).toEqual(['merchant:view']);
  expect(snapshot.isCrossTenant).toBe(false);
  expect(snapshot.merchantScope).toEqual(['m1', 'm2']);
});
