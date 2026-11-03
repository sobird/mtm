import { PrismaClient } from './generated/prisma';

const globalForPrisma = globalThis as typeof globalThis & { __mtmCorePrisma?: PrismaClient };

export const prisma = globalForPrisma.__mtmCorePrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__mtmCorePrisma = prisma;
}
