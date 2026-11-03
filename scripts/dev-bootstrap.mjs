#!/usr/bin/env bun
// Starts PostgreSQL, creates the databases used by the workspaces, then runs
// Prisma generate / migrate / seed for each app. Every step is idempotent and
// this script never starts the applications themselves.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const PG_NOT_READY = 'PostgreSQL 未启动：请先安装并启动 Docker，然后重新执行 bun run dev。';
const DATABASES = [
  'commerce_merchant',
  'commerce_ops',
  'commerce_core',
  'commerce_merchant_test',
  'commerce_core_test',
];
const APPS = ['apps/merchant-admin', 'apps/core-api'];

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    ...options,
  });
}

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function startPostgres() {
  const result = run('docker', ['compose', 'up', '-d', 'postgres'], { timeout: 120_000 });

  if (result.status !== 0) {
    fail(PG_NOT_READY);
  }
}

function waitForPostgres() {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    const result = run('docker', ['compose', 'exec', '-T', 'postgres', 'pg_isready', '-U', 'mtm', '-d', 'postgres'], {
      stdio: 'ignore',
      timeout: 5_000,
    });

    if (result.status === 0) {
      return;
    }

    Bun.sleepSync(1000);
  }

  fail(PG_NOT_READY);
}

function psql(args) {
  return run('docker', ['compose', 'exec', '-T', 'postgres', 'psql', '-U', 'mtm', '-d', 'postgres', ...args]);
}

function ensureDatabase(name) {
  const exists = spawnSync(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'postgres',
      'psql',
      '-U',
      'mtm',
      '-d',
      'postgres',
      '-tAc',
      `SELECT 1 FROM pg_database WHERE datname='${name}'`,
    ],
    { cwd: repoRoot, encoding: 'utf8' }
  );

  if (exists.status !== 0) {
    fail(`无法检查数据库 ${name}：${exists.stderr.trim()}`);
  }

  if (exists.stdout.trim() === '1') {
    return;
  }

  const created = psql(['-c', `CREATE DATABASE "${name}"`]);

  if (created.status !== 0) {
    fail(`无法创建数据库 ${name}。`);
  }

  console.log(`已创建数据库 ${name}`);
}

function runAppScripts(appDir) {
  for (const script of ['db:generate', 'db:migrate', 'db:seed']) {
    console.log(`\n> ${appDir} ${script}`);
    const result = run('bun', ['run', '--cwd', appDir, script]);

    if (result.status !== 0) {
      fail(`${appDir} 的 ${script} 执行失败。`, result.status ?? 1);
    }
  }
}

startPostgres();
waitForPostgres();
DATABASES.forEach(ensureDatabase);
APPS.forEach(runAppScripts);

console.log('\nPostgreSQL 已就绪，数据库已迁移并写入种子数据。');
