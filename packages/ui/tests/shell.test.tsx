import { screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/system/accounts' }));
vi.mock('next-auth/react', () => ({ signOut: vi.fn() }));

import { AdminShell } from '../src';
import { renderWithIntl } from './render';

test('renders menu, account and children', () => {
  renderWithIntl(
    <AdminShell
      title='运营后台'
      account={{ name: '超级管理员', username: 'admin' }}
      menu={[
        {
          id: 'system',
          title: '系统管理',
          url: '/system',
          children: [{ id: 'accounts', title: '账号管理', url: '/system/accounts' }],
        },
      ]}
    >
      <p>内容</p>
    </AdminShell>
  );
  expect(screen.getByText('运营后台')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /账号管理/ })).toBeInTheDocument();
  expect(screen.getByText('超级管理员')).toBeInTheDocument();
  expect(screen.getByText('内容')).toBeInTheDocument();
});
