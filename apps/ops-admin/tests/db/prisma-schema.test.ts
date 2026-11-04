// @vitest-environment node

import { afterAll, expect, test } from 'vitest';

import { prisma } from '@/lib/db/client';

afterAll(() => prisma.$disconnect());

test('connects to the migrated commerce_ops database', async () => {
  await expect(prisma.$queryRaw`SELECT 1`).resolves.toBeDefined();
  // Other test files seed the shared database, so only assert the table is queryable.
  await expect(prisma.opsAccount.count()).resolves.toBeTypeOf('number');
  await expect(prisma.seedMeta.count()).resolves.toBeTypeOf('number');
});
