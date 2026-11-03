import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DATABASE_URL =
  process.env.CORE_TEST_DATABASE_URL ?? 'postgresql://mtm:mtm@localhost:5432/commerce_core_test?schema=public';

export default function globalSetup() {
  // Global setup runs before the test environment, so it must resolve the same
  // test URL independently and refuse to reset anything that is not a *_test DB.
  if (!TEST_DATABASE_URL.includes('_test')) {
    throw new Error(
      `Refusing to reset a non-test database. CORE_TEST_DATABASE_URL must contain "_test"; got: ${TEST_DATABASE_URL}`
    );
  }

  const appRoot = fileURLToPath(new URL('..', import.meta.url));

  execFileSync('bunx', ['prisma', 'migrate', 'reset', '--force', '--skip-seed', '--skip-generate'], {
    cwd: appRoot,
    env: { ...process.env, CORE_DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
