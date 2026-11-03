// @vitest-environment node

import { afterAll, expect, test } from 'vitest';

import { prisma } from '@/lib/db/client';

afterAll(() => prisma.$disconnect());

test('connects to the migrated commerce_ops database', async () => {
  await expect(prisma.$queryRaw`SELECT 1`).resolves.toBeDefined();
  expect(await prisma.opsAccount.count()).toBe(0);
  await expect(prisma.seedMeta.count()).resolves.toBeTypeOf('number');
});
