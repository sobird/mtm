import { NextResponse } from 'next/server';

import { initDatabase, sequelize } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  await initDatabase();
  await sequelize.query('SELECT 1');

  return NextResponse.json({ code: 0, message: 'ok', data: { db: true } });
}
