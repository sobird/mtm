#!/usr/bin/env bun
// Guards against leaking old-system brand names, internal identifiers, private
// network addresses and non-demo email addresses into the public repository.
//
// The pattern list mirrors the open-source policy. The allowlist is deliberately
// narrow: a match is only ignored for an exact `file + pattern` pair, never for
// a whole directory. Public author information is therefore allowed in
// `LICENSE` and `deploy/nginx/mtm.conf` only, and still fails everywhere else.
//
// Note on git history: this scanner only inspects the current working tree. Real
// personal documents and an expired storage token remain in past commits, and
// history is intentionally not rewritten (user decision). Final delivery must
// flag this residual exposure.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Demo email providers that are safe to ship in seeds, documentation and tests.
const DEMO_EMAIL_DOMAINS = ['example.com', 'example.org', 'example.net'];
const DEMO_EMAIL_DOMAIN_PATTERN = DEMO_EMAIL_DOMAINS.join('|').replaceAll('.', '\\.');

// Public dependency mirrors. They look like hostnames but are safe, so the
// internal-host pattern must never treat them as private infrastructure.
const PUBLIC_HOSTS = ['registry.npmmirror.com', 'registry.npmjs.org'];

export const SENSITIVE_PATTERNS = [
  {
    name: 'old-chinese-brand',
    pattern: /美团/gi,
  },
  {
    name: 'old-english-brand',
    pattern: /meituan/gi,
  },
  {
    // Three-letter legacy abbreviation; matches only as a standalone word so
    // it cannot fire on arbitrary substrings.
    name: 'old-abbreviation',
    pattern: /\bthh\b/gi,
  },
  {
    // Legacy internal email domain prefixes.
    name: 'internal-email-domain',
    pattern: /@(?:mtfe|wmfe|roo)\b/gi,
  },
  {
    // Legacy internal package scope.
    name: 'internal-package-scope',
    pattern: /@thh\b/gi,
  },
  {
    // Legacy brand asset prefixes.
    name: 'old-brand-asset-prefix',
    pattern: /\b(?:mt_entry|mtm_logo|thh_)/gi,
  },
  {
    // Author's personal site/deploy domain. Public by design, but only allowed
    // in the exact files registered in FILE_ALLOWLIST below.
    name: 'author-personal-reference',
    pattern: /\bsobird\b/gi,
  },
  {
    // Private network addresses and internal-only hostnames. Loopback and
    // wildcard binds are intentionally not matched.
    name: 'internal-host',
    pattern:
      /(?:\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|\b172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b|\b192\.168\.\d{1,3}\.\d{1,3}\b|\b[a-z0-9-]+\.(?:internal|local|corp|lan)\b|\b(?:dianping|sankuai)\.com\b)/gi,
  },
  {
    // Any email address whose domain is not a reserved demo domain.
    name: 'non-demo-email',
    pattern: new RegExp(
      `[A-Za-z0-9._%+-]+@(?!(?:${DEMO_EMAIL_DOMAIN_PATTERN})\\b)[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}`,
      'gi'
    ),
  },
];

const ALL_PATTERN_NAMES = SENSITIVE_PATTERNS.map(entry => entry.name);

// Exact `file + pattern` exemptions. Keep this list small and reviewed.
const FILE_ALLOWLIST = new Map([
  // The scanner and its tests necessarily contain every pattern as a fixture.
  ['scripts/check-sensitive.mjs', ALL_PATTERN_NAMES],
  ['scripts/check-sensitive.test.mjs', ALL_PATTERN_NAMES],
  // Public author information is allowed only in the license and deploy config.
  ['LICENSE', ['author-personal-reference']],
  ['deploy/nginx/mtm.conf', ['author-personal-reference']],
]);
// Public dependency mirrors are handled by `PUBLIC_HOSTS` at match time, so the
// lockfile and package manifests need no file-level exemption. Keeping the list
// file+pattern precise avoids masking a genuine private host in a manifest.

const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.bmp',
  '.pdf',
  '.zip',
  '.gz',
  '.tgz',
  '.bz2',
  '.xz',
  '.7z',
  '.tar',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.mp3',
  '.mp4',
  '.webm',
  '.wav',
  '.mov',
  '.avi',
  '.node',
  '.so',
  '.dylib',
  '.dll',
  '.exe',
  '.jar',
  '.class',
  '.wasm',
  '.sqlite',
  '.sqlite3',
  '.db',
  '.xls',
  '.xlsx',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
]);

function normalizePath(filePath) {
  return filePath.replaceAll('\\', '/').replace(/^\.\//, '');
}

function extensionOf(filePath) {
  const index = filePath.lastIndexOf('.');

  return index >= 0 ? filePath.slice(index).toLowerCase() : '';
}

function isIgnoredPath(filePath) {
  const path = normalizePath(filePath);

  return (
    path === '' ||
    path.startsWith('node_modules/') ||
    path.includes('/node_modules/') ||
    path.startsWith('.next/') ||
    path.includes('/.next/') ||
    path.startsWith('.turbo/') ||
    path.includes('/.turbo/')
  );
}

function isBinaryPath(filePath) {
  return BINARY_EXTENSIONS.has(extensionOf(filePath));
}

function lineNumberAt(text, offset) {
  let line = 1;

  for (let cursor = 0; cursor < offset; cursor += 1) {
    if (text[cursor] === '\n') {
      line += 1;
    }
  }

  return line;
}

function allowedPatternsFor(filePath) {
  return FILE_ALLOWLIST.get(normalizePath(filePath)) ?? [];
}

/**
 * Scans `text` and returns every sensitive match as a 1-based line number plus
 * the name of the pattern that matched. `filePath` is only used to look up the
 * exact `file + pattern` allowlist.
 */
export function scanText(text, filePath) {
  const allowed = new Set(allowedPatternsFor(filePath));
  const hits = [];

  for (const { name, pattern } of SENSITIVE_PATTERNS) {
    if (allowed.has(name)) {
      continue;
    }

    // Fresh state for every call: the patterns are shared module state.
    pattern.lastIndex = 0;

    let match = pattern.exec(text);

    while (match !== null) {
      if (!PUBLIC_HOSTS.some(host => match[0].toLowerCase().includes(host))) {
        hits.push({ line: lineNumberAt(text, match.index), pattern: name });
      }

      // Zero-length matches would otherwise loop forever.
      if (match[0].length === 0) {
        pattern.lastIndex += 1;
      }

      match = pattern.exec(text);
    }
  }

  return hits.sort((a, b) => a.line - b.line || a.pattern.localeCompare(b.pattern));
}

function readTextFile(absolutePath) {
  const buffer = readFileSync(absolutePath);

  if (buffer.includes(0)) {
    return null;
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return null;
  }
}

function main() {
  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
  const listed = spawnSync('git', ['ls-files', '-z'], { cwd: repoRoot, encoding: 'utf8' });

  if (listed.status !== 0) {
    console.error('无法读取 git ls-files 输出。');
    process.exit(2);
  }

  const files = listed.stdout
    .split('\0')
    .map(file => normalizePath(file.trim()))
    .filter(file => file !== '' && !isIgnoredPath(file) && !isBinaryPath(file));

  let total = 0;
  let scanned = 0;

  for (const file of files) {
    let source;

    try {
      source = readTextFile(`${repoRoot}/${file}`);
    } catch {
      source = null;
    }

    if (source === null) {
      continue;
    }

    scanned += 1;

    for (const hit of scanText(source, file)) {
      total += 1;
      console.log(`${file}:${hit.line} ${hit.pattern}`);
    }
  }

  if (total > 0) {
    console.error(
      `\n发现 ${total} 处敏感引用，分布在 ${scanned} 个已扫描的文本文件中。请改为中性描述；作者公开信息只允许出现在 LICENSE 与 deploy/nginx/mtm.conf。`
    );
    process.exit(1);
  }

  console.error(`检查通过：${scanned} 个文本文件未发现敏感引用。`);
}

if (import.meta.main) {
  main();
}
