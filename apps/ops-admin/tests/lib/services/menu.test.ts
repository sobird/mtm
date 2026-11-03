import { afterAll, expect, test } from 'vitest';

import { initDatabase } from '@/lib/db';
import { prisma } from '@/lib/db/client';
import { OPS_SEED_ADMIN_ID } from '@/lib/db/seed/ids';
import { getMenu } from '@/lib/services/menu';

async function removeFixtures(): Promise<void> {
  const accounts = await prisma.opsAccount.findMany({
    where: { username: { in: ['menu-limited', 'scoped-test-user'] } },
    select: { id: true },
  });
  const accountIds = accounts.map(account => account.id);

  if (accountIds.length > 0) {
    await prisma.opsAccountRole.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.opsAccount.deleteMany({ where: { id: { in: accountIds } } });
  }
}

afterAll(async () => {
  // Keep the Task 7 exact counts (seeded accounts only) valid for other files.
  await removeFixtures();
  await prisma.$disconnect();
});

test('super admin sees the whole ops menu', async () => {
  await initDatabase();
  const { menuItems } = await getMenu(OPS_SEED_ADMIN_ID);
  expect(menuItems.map(item => item.id)).toContain('ops-menu-system');
  expect(menuItems.at(-1)?.last).toBe(true);
});

test('a role without account/role permissions loses that branch', async () => {
  await initDatabase();
  const account = await prisma.opsAccount.create({
    data: { username: 'menu-limited', passwordHash: 'x', name: '菜单受限' },
  });
  const { menuItems } = await getMenu(account.id);
  const ids = JSON.stringify(menuItems);
  expect(ids).not.toContain('ops-menu-system-accounts');
  expect(ids).not.toContain('ops-menu-system-roles');
});
