import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const TEST_DATABASE_URL =
  process.env.CORE_TEST_DATABASE_URL ?? 'postgresql://mtm:mtm@localhost:5432/commerce_core_test?schema=public';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    environment: 'node',
    globalSetup: ['./tests/global-setup.ts'],
    include: ['tests/**/*.test.ts'],
    // The global setup resets one shared test database.
    fileParallelism: false,
    testTimeout: 30_000,
    // Keep the Prisma client and the global setup pointed at the same database.
    env: { CORE_DATABASE_URL: TEST_DATABASE_URL },
  },
});
