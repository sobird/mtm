import { Header } from '@mtm/ui';
import { expect, test } from 'vitest';

import { renderWithIntl } from '../i18n/render';

test('renders the translated sign out action and the locale switcher', () => {
  const { getByRole, getByTestId } = renderWithIntl(
    <Header account={{ name: 'Ops Admin', username: 'admin' }} />,
    'en-US'
  );

  expect(getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  expect(getByTestId('locale-switcher')).toBeInTheDocument();
});
