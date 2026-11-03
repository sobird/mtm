import { prisma } from '../lib/db/client';

async function main() {
  await prisma.seedMeta.upsert({
    where: { version: 'bootstrap' },
    update: { appliedAt: new Date() },
    create: { version: 'bootstrap', appliedAt: new Date() },
  });
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
