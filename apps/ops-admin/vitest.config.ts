import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const TEST_DATABASE_URL =
  process.env.OPS_TEST_DATABASE_URL ?? 'postgresql://mtm:mtm@localhost:5432/commerce_ops_test?schema=public';

export default defineConfig({
  // tsconfig uses `jsx: preserve` for Next.js; Vitest must compile JSX itself.
  oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globalSetup: ['./tests/global-setup.ts'],
    env: { OPS_DATABASE_URL: TEST_DATABASE_URL },
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // The global setup resets one shared test database.
    fileParallelism: false,
    testTimeout: 30_000,
    // Styles are irrelevant in jsdom.
    css: false,
    // Next 15 no longer ships an `exports` map, so Node's ESM resolver cannot
    // resolve next-auth's extensionless `next/server` imports. Let Vite inline
    // and resolve next-auth instead of externalising it.
    server: { deps: { inline: ['next-auth'] } },
  },
});
