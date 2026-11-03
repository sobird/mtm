import { prisma } from '../src/db';
import { seedCoreData } from './seed-data';

try {
  await prisma.seedMeta.upsert({
    where: { version: 'bootstrap' },
    update: {},
    create: { version: 'bootstrap' },
  });
  await seedCoreData(prisma);
} finally {
  await prisma.$disconnect();
}
