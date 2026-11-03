import { Hono } from 'hono';

import { prisma } from './db';

export function createApp(): Hono {
  const app = new Hono();

  app.get('/health', async c => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return c.json({ status: 'ok', db: true });
    } catch {
      return c.json({ status: 'error', db: false }, 503);
    }
  });

  return app;
}
