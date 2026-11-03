import { prisma } from '../lib/db/client';
import { seedDatabase } from '../lib/db/seed';

try {
  await seedDatabase();
} finally {
  await prisma.$disconnect();
}
