import { NextResponse } from 'next/server';

import { initDatabase, prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDatabase();
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({ code: 0, message: 'ok', data: { db: true } });
  } catch {
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: '服务器内部错误', data: null }, { status: 500 });
  }
}
