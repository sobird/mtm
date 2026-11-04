import { expect, test } from 'bun:test';

import { SENSITIVE_PATTERNS, scanText } from './check-sensitive.mjs';

test('exports the sensitive pattern catalog', () => {
  expect(Array.isArray(SENSITIVE_PATTERNS)).toBe(true);
  expect(SENSITIVE_PATTERNS.length).toBeGreaterThan(0);

  for (const entry of SENSITIVE_PATTERNS) {
    expect(typeof entry.name).toBe('string');
    expect(entry.pattern).toBeInstanceOf(RegExp);
  }
});

test('flags the old Chinese and English brand in arbitrary files', () => {
  expect(scanText('美团', 'docs/example.md').length).toBeGreaterThan(0);
  expect(scanText('Meituan', 'docs/example.md').length).toBeGreaterThan(0);
  // The English brand pattern is case-insensitive, so all-caps must still hit.
  expect(scanText('MEITUAN', 'docs/example.md').length).toBeGreaterThan(0);
});

test('flags the old abbreviation only on word boundaries', () => {
  expect(scanText('thh', 'docs/example.md').length).toBeGreaterThan(0);
  // Case-insensitive: uppercase and mixed-case spellings are caught too.
  expect(scanText('THH', 'docs/example.md').length).toBeGreaterThan(0);
  expect(scanText('Thh', 'docs/example.md').length).toBeGreaterThan(0);
  expect(scanText('thhx', 'docs/example.md')).toEqual([]);
});

test('flags internal email domain prefixes and package scope', () => {
  expect(scanText('someone@mtfe.example', 'docs/example.md').length).toBeGreaterThan(0);
  expect(scanText('someone@wmfe.example', 'docs/example.md').length).toBeGreaterThan(0);
  expect(scanText('someone@roo.example', 'docs/example.md').length).toBeGreaterThan(0);
  expect(scanText('@thh/utils', 'docs/example.md').length).toBeGreaterThan(0);
});

test('flags old brand asset prefixes', () => {
  expect(scanText('mt_entry.png', 'docs/example.md').length).toBeGreaterThan(0);
  expect(scanText('mtm_logo.png', 'docs/example.md').length).toBeGreaterThan(0);
  expect(scanText('thh_market.html', 'docs/example.md').length).toBeGreaterThan(0);
});

test('flags private network addresses but not loopback', () => {
  expect(scanText('http://10.20.30.40/api', 'docs/example.md').length).toBeGreaterThan(0);
  expect(scanText('http://192.168.1.10/api', 'docs/example.md').length).toBeGreaterThan(0);
  expect(scanText('http://127.0.0.1:3000', 'docs/example.md')).toEqual([]);
  expect(scanText('*.local', '.gitignore')).toEqual([]);
  expect(scanText('db.internal.example', 'docs/example.md').length).toBeGreaterThan(0);
});

test('allows the registered public author info only in its own files', () => {
  expect(scanText('Copyright (c) 2021 sobird', 'LICENSE')).toEqual([]);
  expect(scanText('Copyright (c) 2021 sobird', 'docs/example.md').length).toBeGreaterThan(0);

  expect(scanText('server_name mtm.sobird.me;', 'deploy/nginx/mtm.conf')).toEqual([]);
  expect(scanText('server_name mtm.sobird.me;', 'docs/example.md').length).toBeGreaterThan(0);
});

test('allows demo emails and flags non-demo addresses', () => {
  expect(scanText('merchant@example.com', 'docs/example.md')).toEqual([]);
  expect(scanText('staff@example.org', 'docs/example.md')).toEqual([]);
  expect(scanText('someone@corp-mail.test', 'docs/example.md').length).toBeGreaterThan(0);
  // An internal-domain email is a non-demo address and must be flagged.
  expect(scanText('someone@dianping.com', 'docs/example.md').map(hit => hit.pattern)).toContain('internal-host');
});

test('reports 1-based line numbers and pattern names', () => {
  expect(scanText('ok\n美团\nok', 'docs/example.md')).toEqual([{ line: 2, pattern: 'old-chinese-brand' }]);
});
test('reports every matching pattern on the same line', () => {
  const names = scanText('美团 Meituan', 'docs/example.md').map(hit => hit.pattern);

  expect(names).toContain('old-chinese-brand');
  expect(names).toContain('old-english-brand');
});
