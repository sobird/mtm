import { expect, test } from 'vitest';

import { createApp } from '@/src/app';

test('GET /health reports database readiness', async () => {
  const response = await createApp().request('/health');
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok', db: true });
});
