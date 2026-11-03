import { signServiceToken } from '@mtm/auth/service-token';

import { prisma } from '@/src/db';

process.env.CORE_API_JWT_SECRET ||= 'test-core-secret';

function secret(): string {
  return process.env.CORE_API_JWT_SECRET!;
}

export function opsToken(permissions: string[], merchantScope: string[] | null = null): Promise<string> {
  return signServiceToken(
    { portal: 'ops', userId: 'ops-test', merchantId: null, permissions, merchantScope },
    secret()
  );
}

export function merchantToken(merchantId: string, permissions: string[]): Promise<string> {
  return signServiceToken(
    { portal: 'merchant', userId: 'merchant-test', merchantId, permissions, merchantScope: null },
    secret()
  );
}

/**
 * Deletes commerce_core fixtures in dependency order so later test files start
 * from a clean slate. Safe to call when the tables are already empty.
 */
export async function resetCoreFixtures(): Promise<void> {
  await prisma.categoryAttribute.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.mediaAsset.deleteMany();
}
