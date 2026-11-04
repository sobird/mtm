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
  // Product 与 ProductVersion 互相引用，先清空指针再按依赖顺序删除。
  await prisma.product.updateMany({ data: { currentVersionId: null, publishedVersionId: null } });
  await prisma.auditRecord.deleteMany();
  await prisma.sku.deleteMany();
  await prisma.productVersion.deleteMany();
  await prisma.product.deleteMany();
  await prisma.categoryAttribute.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.coreOperationLog.deleteMany();
}
