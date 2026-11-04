#!/usr/bin/env bun
// Generates `.env.docker` when missing (keeping an existing file untouched) and
// then starts the full self-hosted stack with `docker compose up --build`.
import { spawnSync } from 'node:child_process';
import { chmodSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { ensureDockerEnvFile } from './docker-env.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const envFile = fileURLToPath(new URL('../.env.docker', import.meta.url));

if (ensureDockerEnvFile(envFile)) {
  console.log('已生成 .env.docker（含随机密钥），请妥善保管。');
} else {
  try {
    // Tighten an older file created before we wrote 0600, but never fail here.
    chmodSync(envFile, 0o600);
  } catch {
    // Permission changes are best-effort; the file is still readable by compose.
  }
}

const result = spawnSync('docker', ['compose', 'up', '--build'], {
  cwd: repoRoot,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
