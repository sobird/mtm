import { prisma } from './client';
import { seedDatabase } from './seed';

let initPromise: Promise<void> | null = null;

export async function initDatabase(): Promise<void> {
  initPromise ??= (async () => {
    await prisma.$queryRaw`SELECT 1`;
    await seedDatabase();
  })().catch(error => {
    initPromise = null;
    throw error;
  });

  return initPromise;
}

export { prisma };
