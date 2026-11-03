import { SeedMeta } from '../models';
import { CORE_SEED_VERSION, seedCore } from './core';

export { CORE_SEED_VERSION, seedCore };

/**
 * Runs every seed group whose version has not been applied yet. Each group is
 * checked independently so a database that already has the core seed still
 * receives later seeds (for example the marketing seed added in Task 6).
 */
export async function seedDatabase(): Promise<void> {
  const coreApplied = await SeedMeta.findOne({ where: { version: CORE_SEED_VERSION } });

  if (!coreApplied) {
    await seedCore();
  }
}
