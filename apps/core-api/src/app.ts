import { Hono } from 'hono';

import { requireServiceToken } from './auth';
import type { AuthVariables } from './auth';
import { prisma } from './db';

export function createApp(): Hono<{ Variables: AuthVariables }> {
  const app = new Hono<{ Variables: AuthVariables }>();

  app.get('/health', async c => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return c.json({ status: 'ok', db: true });
    } catch {
      return c.json({ status: 'error', db: false }, 503);
    }
  });

  app.use('/api/v1/*', requireServiceToken);

  app.get('/api/v1/me', c => c.json({ data: c.get('auth') }));

  return app;
}
