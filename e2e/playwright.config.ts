import { defineConfig } from '@playwright/test';

const E2E = {
  MERCHANT_DATABASE_URL: 'postgresql://mtm:mtm@localhost:5432/commerce_merchant_e2e?schema=public',
  CORE_DATABASE_URL: 'postgresql://mtm:mtm@localhost:5432/commerce_core_e2e?schema=public',
  OPS_DATABASE_URL: 'postgresql://mtm:mtm@localhost:5432/commerce_ops_e2e?schema=public',
  AUTH_SECRET: 'e2e-merchant-secret',
  OPS_AUTH_SECRET: 'e2e-ops-secret',
  CORE_API_JWT_SECRET: 'e2e-core-secret',
  CORE_API_URL: 'http://localhost:4000',
  CORE_PUBLIC_URL: 'http://localhost:4000',
  AUTH_COOKIE_SECURE: 'false',
};

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  retries: 1,
  // The specs share one seeded database, so files must not mutate it in parallel.
  workers: 1,
  use: {
    browserName: 'chromium',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'bun --cwd=../apps/merchant-admin run start',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      env: E2E,
    },
    {
      command: 'bun --cwd=../apps/ops-admin run start',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      env: E2E,
    },
    {
      command: 'bun --cwd=../apps/core-api run start',
      port: 4000,
      reuseExistingServer: !process.env.CI,
      env: E2E,
    },
  ],
});
