import { expect, test } from 'bun:test';

import { findHardcodedChinese } from './check-i18n.mjs';

test('flags Chinese UI text', () => {
  expect(findHardcodedChinese('<Input placeholder="请输入商品标题" />', 'apps/x.tsx')).toHaveLength(1);
});

test('ignores comments, tests, server routes and allowlisted paths', () => {
  expect(findHardcodedChinese('// 中文注释\nconst x = 1;', 'apps/x.tsx')).toEqual([]);
  expect(findHardcodedChinese('<span>你好</span>', 'apps/merchant-admin/tests/x.test.tsx')).toEqual([]);
  expect(findHardcodedChinese("throw new Error('未登录')", 'apps/merchant-admin/app/api/x/route.ts')).toEqual([]);
});

test('flags toast and modal copy', () => {
  expect(findHardcodedChinese("toast.error('保存失败')", 'apps/x.tsx')).toHaveLength(1);
  expect(findHardcodedChinese("message: '确认删除？'", 'apps/x.tsx')).toHaveLength(1);
});

test('honours i18n-ignore on the same line', () => {
  expect(findHardcodedChinese('<span>业务数据</span> // i18n-ignore', 'apps/x.tsx')).toEqual([]);
});
