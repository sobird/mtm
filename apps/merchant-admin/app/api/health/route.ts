import { fail, ok } from '@/lib/api-response';
import { initDatabase, prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDatabase();
    await prisma.$queryRaw`SELECT 1`;

    return ok({ db: true });
  } catch (error) {
    return fail(error);
  }
}
