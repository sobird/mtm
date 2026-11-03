import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { Can, PermissionButton, PermissionProvider } from '../src';

test('Can hides children without the permission', () => {
  const { rerender } = render(
    <PermissionProvider permissions={[]}>
      <Can permission='account:manage'>可见</Can>
    </PermissionProvider>
  );
  expect(screen.queryByText('可见')).not.toBeInTheDocument();

  rerender(
    <PermissionProvider permissions={['account:manage']}>
      <Can permission='account:manage'>可见</Can>
    </PermissionProvider>
  );
  expect(screen.getByText('可见')).toBeInTheDocument();
});

test('PermissionButton renders a Button only when allowed', () => {
  const { rerender } = render(
    <PermissionProvider permissions={[]}>
      <PermissionButton permission='role:manage'>新建角色</PermissionButton>
    </PermissionProvider>
  );
  expect(screen.queryByRole('button', { name: '新建角色' })).not.toBeInTheDocument();

  rerender(
    <PermissionProvider permissions={['role:manage']}>
      <PermissionButton permission='role:manage'>新建角色</PermissionButton>
    </PermissionProvider>
  );
  expect(screen.getByRole('button', { name: '新建角色' })).toBeInTheDocument();
});
