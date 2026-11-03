import { prisma } from '../client';
import { seedOpsAuth } from './auth';
import { OPS_AUTH_SEED_VERSION } from './ids';

export { OPS_MENU_SEEDS, OPS_PERMISSION_SEEDS, seedOpsAuth } from './auth';
export { OPS_AUTH_SEED_VERSION, OPS_SEED_ADMIN_ID, OPS_SEED_SUPER_ROLE_ID } from './ids';

/**
 * Seeds ops authentication data once per version. The version check and every
 * write share one transaction so a partially seeded database is never marked
 * as complete or left inconsistent.
 */
export async function seedDatabase(): Promise<void> {
  await prisma.$transaction(async tx => {
    const applied = await tx.seedMeta.findUnique({ where: { version: OPS_AUTH_SEED_VERSION } });

    if (applied) {
      return;
    }

    await seedOpsAuth(tx);

    await tx.seedMeta.upsert({
      where: { version: OPS_AUTH_SEED_VERSION },
      update: { appliedAt: new Date() },
      create: { version: OPS_AUTH_SEED_VERSION, appliedAt: new Date() },
    });
  });
}
