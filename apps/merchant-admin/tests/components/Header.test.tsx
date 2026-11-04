import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

import Header from '@/components/layout/Header';
import type { AccountDTO } from '@/lib/services/account';

import { renderWithIntl } from '../i18n/render';

const ACCOUNT: AccountDTO = {
  id: 'account-1',
  login: 'merchant',
  name: 'Merchant Owner',
  mobile: '13400000000',
  interCode: '86',
  merchantId: 'merchant-1',
  isOwner: true,
};

test('renders translated header actions and the locale switcher', async () => {
  const user = userEvent.setup();
  renderWithIntl(<Header account={ACCOUNT} />, 'en-US');

  expect(screen.getByRole('button', { name: 'Toggle sidebar' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Account menu' })).toBeInTheDocument();
  expect(screen.getByTestId('locale-switcher')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Account menu' }));
  expect(await screen.findByText('Sign out')).toBeInTheDocument();
});
