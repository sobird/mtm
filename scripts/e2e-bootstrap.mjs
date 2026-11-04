#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Creates the dedicated `*_e2e` databases and seeds each app into them so
// Playwright can start the three applications against isolated data.
import { SQL } from 'bun';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const BASE = process.env.CI_DATABASE_URL ?? 'postgresql://mtm:mtm@localhost:5432/postgres';

const APPS = [
  { dir: 'apps/merchant-admin', database: 'commerce_merchant_e2e', envVar: 'MERCHANT_DATABASE_URL' },
  { dir: 'apps/core-api', database: 'commerce_core_e2e', envVar: 'CORE_DATABASE_URL' },
  { dir: 'apps/ops-admin', database: 'commerce_ops_e2e', envVar: 'OPS_DATABASE_URL' },
];

function databaseUrl(name) {
  const url = new URL(BASE);
  url.pathname = `/${name}`;
  return url.toString();
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    ...options,
  });

  if (result.error) {
    throw new Error(`无法执行 ${command} ${args.join(' ')}：${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} 退出码为 ${result.status}，请检查上方日志。`);
  }
}

async function ensureDatabases() {
  const sql = new SQL(BASE);

  try {
    // Databases are created sequentially: each CREATE DATABASE runs on the
    // maintenance connection, so keep it deterministic instead of racing them.
    for (const app of APPS) {
      // eslint-disable-next-line no-await-in-loop
      const rows = await sql`SELECT 1 FROM pg_database WHERE datname = ${app.database}`;

      if (rows.length === 0) {
        // eslint-disable-next-line no-await-in-loop
        await sql.unsafe(`CREATE DATABASE "${app.database}"`);
        console.log(`created ${app.database}`);
      }
    }
  } finally {
    await sql.close();
  }
}

await ensureDatabases();

for (const app of APPS) {
  const env = { ...process.env, [app.envVar]: databaseUrl(app.database) };
  const appDir = `${repoRoot}${app.dir}`;

  console.log(`\n> ${app.dir} prisma migrate reset`);
  run('bunx', ['prisma', 'migrate', 'reset', '--force', '--skip-generate', '--skip-seed'], { cwd: appDir, env });

  console.log(`\n> ${app.dir} prisma/seed.ts`);
  run('bun', ['prisma/seed.ts'], { cwd: appDir, env });
}

console.log('\nE2E 数据库已创建、迁移并写入种子数据。');
