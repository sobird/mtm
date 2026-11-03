import { PrismaClient } from '@/lib/generated/prisma';

const globalForPrisma = globalThis as typeof globalThis & { __mtmOpsPrisma?: PrismaClient };

export const prisma = globalForPrisma.__mtmOpsPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__mtmOpsPrisma = prisma;
}
