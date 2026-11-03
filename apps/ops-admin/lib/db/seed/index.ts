import { prisma } from '../client';

/**
 * Placeholder seed for the ops database. Task 7 replaces this with the real
 * accounts, roles, permissions, and menu seeds.
 */
export async function seedDatabase(): Promise<void> {
  await prisma.seedMeta.upsert({ where: { version: 'bootstrap' }, update: {}, create: { version: 'bootstrap' } });
}
