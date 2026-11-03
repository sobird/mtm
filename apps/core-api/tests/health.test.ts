import { expect, test, vi } from 'vitest';

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }));

vi.mock('@/src/db', () => ({ prisma: { $queryRaw: queryRaw } }));

import { createApp } from '@/src/app';

test('GET /health reports database readiness', async () => {
  queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
  const response = await createApp().request('/health');
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok', db: true });
});

test('GET /health reports 503 when the database is unavailable', async () => {
  queryRaw.mockRejectedValueOnce(new Error('database unavailable'));
  const response = await createApp().request('/health');
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ status: 'error', db: false });
});
