import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DATABASE_URL =
  process.env.MERCHANT_TEST_DATABASE_URL ?? 'postgresql://mtm:mtm@localhost:5432/commerce_merchant_test?schema=public';

export default function globalSetup() {
  const appRoot = fileURLToPath(new URL('..', import.meta.url));

  execFileSync('bunx', ['prisma', 'migrate', 'reset', '--force', '--skip-seed', '--skip-generate'], {
    cwd: appRoot,
    env: { ...process.env, MERCHANT_DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
