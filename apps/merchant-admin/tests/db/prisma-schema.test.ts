// @vitest-environment node

import { afterAll, expect, it } from 'vitest';

import { prisma } from '@/lib/db/client';

afterAll(async () => {
  await prisma.$disconnect();
});

it('connects to the migrated database', async () => {
  await expect(prisma.$queryRaw`SELECT 1`).resolves.toBeDefined();
  await expect(prisma.seedMeta.count()).resolves.toBeTypeOf('number');
});
