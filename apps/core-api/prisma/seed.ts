import { prisma } from '../src/db';

try {
  await prisma.seedMeta.upsert({
    where: { version: 'bootstrap' },
    update: {},
    create: { version: 'bootstrap' },
  });
} finally {
  await prisma.$disconnect();
}
