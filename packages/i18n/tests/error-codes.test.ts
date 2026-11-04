import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { getMessages } from '../src';

const ROOT = new URL('../../../', import.meta.url).pathname;

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (name === 'node_modules' || name === 'generated' || name === '.next') return [];
    return statSync(path).isDirectory() ? filesUnder(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

function collectCodes(): Set<string> {
  const codes = new Set<string>();
  const sources = [
    ...filesUnder(join(ROOT, 'apps/core-api/src')),
    ...filesUnder(join(ROOT, 'apps/merchant-admin/lib')),
    ...filesUnder(join(ROOT, 'apps/merchant-admin/app')),
    ...filesUnder(join(ROOT, 'apps/ops-admin/lib')),
    ...filesUnder(join(ROOT, 'apps/ops-admin/app')),
  ];
  for (const file of sources) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/new (?:HttpError|AppError|ApiError)\('([A-Z][A-Z0-9_]+)'/g)) codes.add(match[1]);
    for (const match of text.matchAll(/code: '([A-Z][A-Z0-9_]+)'/g)) codes.add(match[1]);
  }
  return codes;
}

describe('error catalog', () => {
  test('every source error code has both translations', () => {
    const zh = getMessages('zh-CN').errors as Record<string, string>;
    const en = getMessages('en-US').errors as Record<string, string>;
    const missing = [...collectCodes()].filter(code => !(code in zh) || !(code in en));
    expect(missing).toEqual([]);
  });
});
