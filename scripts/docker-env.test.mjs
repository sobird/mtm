import { expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { buildDockerEnv, ensureDockerEnvFile } from './docker-env.mjs';

test('does not overwrite an existing env file', () => {
  expect(buildDockerEnv('AUTH_SECRET=keep')).toBe('AUTH_SECRET=keep');
});

test('generates container URLs, random secrets and demo flags', () => {
  const text = buildDockerEnv(null, { RANDOM: () => 'abc123' });
  expect(text).toContain('MERCHANT_DATABASE_URL=postgresql://mtm:mtm@postgres:5432/commerce_merchant?schema=public');
  expect(text).toContain('CORE_API_URL=http://core-api:4000');
  expect(text).toContain('CORE_PUBLIC_URL=http://localhost:4000');
  expect(text).toContain('AUTH_COOKIE_SECURE=false');
  expect(text).toContain('SEED_DEMO_DATA=true');
  expect(text).toContain('AUTH_SECRET=abc123');
});

test('creates a missing env file with generated secrets and 0600 mode', () => {
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'mtm-docker-env-')), '.env.docker');
  expect(ensureDockerEnvFile(file)).toBe(true);
  const content = readFileSync(file, 'utf8');
  expect(content.length).toBeGreaterThan(0);
  expect(content).toContain('AUTH_SECRET=');
  if (process.platform !== 'win32') {
    expect(statSync(file).mode & 0o777).toBe(0o600);
  }
});

test('keeps an existing env file unchanged', () => {
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'mtm-docker-env-')), '.env.docker');
  writeFileSync(file, 'AUTH_SECRET=keep');
  expect(ensureDockerEnvFile(file)).toBe(false);
  expect(readFileSync(file, 'utf8')).toBe('AUTH_SECRET=keep');
});
