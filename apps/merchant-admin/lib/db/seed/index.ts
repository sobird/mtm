import { prisma } from '../client';
import { CORE_SEED_VERSION, seedCore } from './core';
import { MARKETING_SEED_VERSION, seedMarketing } from './marketing';

export { CORE_SEED_VERSION, MARKETING_SEED_VERSION, seedCore, seedMarketing };

/**
 * Runs every seed group whose version has not been applied yet. Each group is
 * checked independently so a database that already has the core seed still
 * receives later seeds (for example the marketing seed added in Task 6).
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
}
