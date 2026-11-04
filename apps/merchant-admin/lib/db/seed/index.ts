import { prisma } from '../client';
import { seedMerchantAuth } from './auth';
import { CORE_SEED_VERSION, seedCore } from './core';
import { MERCHANT_AUTH_SEED_VERSION } from './ids';
import { MARKETING_SEED_VERSION, seedMarketing } from './marketing';

export { MERCHANT_MENU_SEEDS, MERCHANT_PERMISSION_SEEDS, seedAuth, seedMerchantAuth } from './auth';
export { CORE_SEED_VERSION, MERCHANT_AUTH_SEED_VERSION, MARKETING_SEED_VERSION, seedCore, seedMarketing };

/**
 * Runs every seed group whose version has not been applied yet. Each group is
 * checked independently so a database that already has the core seed still
 * receives later seeds (for example the merchant auth seed added in Task 12).
 */
export async function seedDatabase(): Promise<void> {
  const coreApplied = await prisma.seedMeta.findUnique({ where: { version: CORE_SEED_VERSION } });

  if (!coreApplied) {
    await seedCore();
  }

  const marketingApplied = await prisma.seedMeta.findUnique({ where: { version: MARKETING_SEED_VERSION } });

  if (!marketingApplied) {
    await seedMarketing();
  }

  const authApplied = await prisma.seedMeta.findUnique({ where: { version: MERCHANT_AUTH_SEED_VERSION } });

  if (!authApplied) {
    await prisma.$transaction(async tx => {
      const applied = await tx.seedMeta.findUnique({ where: { version: MERCHANT_AUTH_SEED_VERSION } });

      if (applied) {
        return;
      }

      await seedMerchantAuth(tx);

      await tx.seedMeta.upsert({
        where: { version: MERCHANT_AUTH_SEED_VERSION },
        update: { appliedAt: new Date() },
        create: { version: MERCHANT_AUTH_SEED_VERSION, appliedAt: new Date() },
      });
    });
  }
}
