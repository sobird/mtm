import { afterAll, beforeEach, expect, test } from 'vitest';

import { authenticateOpsUser } from '@/lib/auth';
import { initDatabase } from '@/lib/db';
import { prisma } from '@/lib/db/client';
import { opsLoginLimiter } from '@/lib/rate-limit';

afterAll(async () => {
  // The disabled-account fixture below must not leak into other test files.
  await prisma.opsAccount.deleteMany({ where: { username: 'disabled-user' } });
  await prisma.$disconnect();
});

beforeEach(async () => {
  await initDatabase();
  opsLoginLimiter.clear();
});

test('authenticates the seeded admin and records success', async () => {
  const user = await authenticateOpsUser('admin', 'admin123');
  expect(user).toMatchObject({ username: 'admin', portal: 'ops' });
  expect(await prisma.opsLoginLog.count({ where: { success: true } })).toBeGreaterThan(0);
  const admin = await prisma.opsAccount.findUniqueOrThrow({ where: { username: 'admin' } });
  expect(admin.lastLoginAt).not.toBeNull();
});

test('returns null for wrong passwords, unknown users and disabled accounts', async () => {
  expect(await authenticateOpsUser('admin', 'wrong')).toBeNull();
  expect(await authenticateOpsUser('nobody', 'whatever')).toBeNull();

  await prisma.opsAccount.create({
    data: { username: 'disabled-user', passwordHash: 'x', name: '停用', status: 'DISABLED' },
  });
  expect(await authenticateOpsUser('disabled-user', 'x')).toBeNull();
  expect(await prisma.opsLoginLog.count({ where: { success: false } })).toBeGreaterThan(0);
});

test('blocks after five failures even with the correct password', async () => {
  await Array.fromAsync({ length: 5 }, () => authenticateOpsUser('admin', 'wrong'));
  expect(await authenticateOpsUser('admin', 'admin123')).toBeNull();
  opsLoginLimiter.reset('ops:admin');
  expect(await authenticateOpsUser('admin', 'admin123')).not.toBeNull();
});
