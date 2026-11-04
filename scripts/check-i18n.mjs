#!/usr/bin/env bun
// Guards against hardcoded Chinese UI copy in the open-source portals.
//
// Only UI-facing positions are inspected: JSX text, common accessibility /
// form attributes and user-visible call arguments (toast / message / Modal /
// notification). Comments are stripped before matching, so Chinese comments
// never fail the gate. Genuine business data (for example locale display names
// or demo category names) can opt out with `// i18n-ignore` on the same line
// or `// i18n-ignore-next-line` on the line above.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

const IGNORED_PATH_PATTERNS = [
  /(^|\/)tests?\//,
  /\.(test|spec)\.[^/]+$/,
  /(^|\/)generated\//,
  /(^|\/)prisma\//,
  /(^|\/)lib\/db\/seed\//,
  /(^|\/)messages\/[^/]+\.json$/,
  /(^|\/)scripts\//,
  /(^|\/)e2e\//,
  /(^|\/)docs\//,
  /(^|\/)app\/(?:.*\/)?api\//,
];

const IN_SCOPE_PATTERNS = [
  /^apps\/[^/]+\/app\//,
  /^apps\/[^/]+\/components\//,
  /^packages\/ui\/src\//,
  /^packages\/i18n\/src\//,
];

const ATTRIBUTE_PATTERN =
  /\b(?:label|placeholder|title|aria-label|aria-description|alt)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g;
const CALL_PATTERN = /\b(?:toast|message|Modal|notification)\.[A-Za-z_$][\w$]*\s*\(([^)]*)\)/g;
const OBJECT_PATTERN = /\b(?:message|description|title|content)\s*:\s*(?:'([^'\\]*)'|"([^"\\]*)"|`([^`]*)`)/g;
// JSX text directly before a tag or an expression: `>共 ` in `共 {total} 条`.
const JSX_TEXT_OPEN_PATTERN = />([^<>{}]*)(?=[<{])/g;
// JSX text directly after an expression: ` 条` in `共 {total} 条<`.
const JSX_TEXT_CLOSE_PATTERN = /\}([^<>{}]*)(?=<)/g;

function normalizePath(filePath) {
  return filePath.replaceAll('\\', '/').replace(/^\.\//, '');
}

function isIgnoredPath(filePath) {
  const path = normalizePath(filePath);

  return IGNORED_PATH_PATTERNS.some(pattern => pattern.test(path));
}

/**
 * Replaces comment bodies with spaces while preserving every line break, so
 * offsets and line numbers stay aligned with the original file. String and
 * template literals are honoured so `https://` is not mistaken for a comment.
 */
function stripComments(source) {
  const output = Array.from(source);
  let index = 0;

  const blank = start => {
    for (let cursor = start; cursor < index; cursor += 1) {
      if (output[cursor] !== '\n') {
        output[cursor] = ' ';
      }
    }
  };

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (char === '/' && next === '/') {
      const start = index;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      blank(start);
      continue;
    }

    if (char === '/' && next === '*') {
      const start = index;
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      index = Math.min(index + 2, source.length);
      blank(start);
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      const quote = char;
      index += 1;
      while (index < source.length) {
        if (source[index] === '\\') {
          index += 2;
          continue;
        }
        if (source[index] === quote) {
          index += 1;
          break;
        }
        if (quote !== '`' && source[index] === '\n') {
          break;
        }
        index += 1;
      }
      continue;
    }

    index += 1;
  }

  return output.join('');
}

function lineNumberAt(source, offset) {
  let line = 1;

  for (let cursor = 0; cursor < offset; cursor += 1) {
    if (source[cursor] === '\n') {
      line += 1;
    }
  }

  return line;
}

function captureContainsCjk(match) {
  for (let group = 1; group < match.length; group += 1) {
    if (typeof match[group] === 'string' && CJK.test(match[group])) {
      return true;
    }
  }

  return false;
}

function collectSourceMatches(source, stripped, pattern) {
  const found = [];

  pattern.lastIndex = 0;

  let match = pattern.exec(stripped);

  while (match !== null) {
    const cjkOffset = match[0].search(CJK);

    if (cjkOffset >= 0 && captureContainsCjk(match)) {
      found.push(lineNumberAt(source, match.index + cjkOffset));
    }
    match = pattern.exec(stripped);
  }

  return found;
}

/**
 * Returns the hardcoded Chinese UI strings in `source`. Each hit carries the
 * 1-based line number and the trimmed source line.
 */
export function findHardcodedChinese(source, filePath) {
  if (isIgnoredPath(filePath)) {
    return [];
  }

  const stripped = stripComments(source);
  const originalLines = source.split('\n');

  const lineHits = new Set([
    ...collectSourceMatches(source, stripped, ATTRIBUTE_PATTERN),
    ...collectSourceMatches(source, stripped, CALL_PATTERN),
    ...collectSourceMatches(source, stripped, OBJECT_PATTERN),
    ...collectSourceMatches(source, stripped, JSX_TEXT_OPEN_PATTERN),
    ...collectSourceMatches(source, stripped, JSX_TEXT_CLOSE_PATTERN),
  ]);

  const hits = [];

  for (const line of [...lineHits].sort((a, b) => a - b)) {
    const original = originalLines[line - 1] ?? '';
    const previous = originalLines[line - 2] ?? '';

    if (original.includes('i18n-ignore') || previous.includes('i18n-ignore-next-line')) {
      continue;
    }

    hits.push({ line, text: original.trim() });
  }

  return hits;
}

function isInScope(filePath) {
  return IN_SCOPE_PATTERNS.some(pattern => pattern.test(filePath));
}

function main() {
  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
  const listed = spawnSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' });

  if (listed.status !== 0) {
    console.error('无法读取 git ls-files 输出。');
    process.exit(2);
  }

  const files = listed.stdout
    .split('\n')
    .map(file => normalizePath(file.trim()))
    .filter(file => (file.endsWith('.ts') || file.endsWith('.tsx')) && isInScope(file));

  let total = 0;

  for (const file of files) {
    const source = readFileSync(`${repoRoot}/${file}`, 'utf8');
    const hits = findHardcodedChinese(source, file);

    for (const hit of hits) {
      total += 1;
      console.log(`${file}:${hit.line} ${hit.text}`);
    }
  }

  if (total > 0) {
    console.error(
      `\n发现 ${total} 处硬编码中文界面文案。请改用 useTranslations / getTranslations；业务数据请标注 // i18n-ignore。`
    );
    process.exit(1);
  }

  console.error(`检查通过：${files.length} 个界面文件未发现硬编码中文。`);
}

if (import.meta.main) {
  main();
}
