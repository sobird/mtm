import { expect, test } from 'vitest';

import { filterMenuTree } from '../src/menu-filter';

const tree = [
  {
    id: 'system',
    parentId: '-1',
    permissionCode: null,
    children: [
      { id: 'accounts', parentId: 'system', url: '/system/accounts', permissionCode: 'account:manage' },
      { id: 'roles', parentId: 'system', url: '/system/roles', permissionCode: 'role:manage' },
    ],
  },
  { id: 'home', parentId: '-1', url: '/', permissionCode: null },
];

test('keeps open items and granted leaves', () => {
  const result = filterMenuTree(tree, new Set(['role:manage']));
  expect(result.map(item => item.id)).toEqual(['system', 'home']);
  expect(result[0].children?.map(item => item.id)).toEqual(['roles']);
});

test('drops a group when no child survives', () => {
  const result = filterMenuTree(tree, new Set());
  expect(result.map(item => item.id)).toEqual(['home']);
});

test('does not mutate the input', () => {
  const before = JSON.stringify(tree);
  filterMenuTree(tree, new Set());
  expect(JSON.stringify(tree)).toBe(before);
});
