import { PrismaClient } from '@/lib/generated/prisma';

const globalForPrisma = globalThis as typeof globalThis & { __mtmPrisma?: PrismaClient };

export const prisma = globalForPrisma.__mtmPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__mtmPrisma = prisma;
}
