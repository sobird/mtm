#!/usr/bin/env bun
// Generates `.env.docker` when missing (keeping an existing file untouched) and
// then starts the full self-hosted stack with `docker compose up --build`.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { buildDockerEnv } from './docker-env.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const envFile = fileURLToPath(new URL('../.env.docker', import.meta.url));

const existing = existsSync(envFile) ? readFileSync(envFile, 'utf8') : null;

if (!existing) {
  writeFileSync(envFile, buildDockerEnv(null), { mode: 0o600 });
  console.log('已生成 .env.docker（含随机密钥），请妥善保管。');
}

const result = spawnSync('docker', ['compose', 'up', '--build'], {
  cwd: repoRoot,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
