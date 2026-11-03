import { fail, ok } from '@/lib/api-response';
import { initDatabase, sequelize } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDatabase();
    await sequelize.query('SELECT 1');

    return ok({ db: true });
  } catch (error) {
    return fail(error);
  }
}
