import { verifyPassword } from '@mtm/auth/password';
import { afterAll, expect, test } from 'vitest';

import { prisma } from '@/lib/db/client';
import { seedDatabase } from '@/lib/db/seed';

afterAll(() => prisma.$disconnect());

test('seeds ops permissions, roles, admin and menus idempotently', async () => {
  await seedDatabase();
  await seedDatabase();

  expect(await prisma.opsPermission.count()).toBe(10);
  expect(await prisma.opsRole.count()).toBe(1);
  expect(await prisma.opsMenuItem.count()).toBe(9);

  const admin = await prisma.opsAccount.findUniqueOrThrow({
    where: { username: 'admin' },
    include: { roles: { include: { role: { include: { permissions: true } } } } },
  });
  expect(admin.roles).toHaveLength(1);
  expect(admin.roles[0].role.code).toBe('super-admin');
  expect(admin.roles[0].role.permissions).toHaveLength(10);
  await expect(verifyPassword(admin.passwordHash, 'admin123')).resolves.toBe(true);
});
