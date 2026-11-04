import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import { ToastProvider } from '@/components/ui/Toast';

import { renderWithIntl } from '../i18n/render';

vi.mock('next-auth/react', () => ({ signOut: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import { EntryHeader } from '@/components/entry/EntryHeader';
import { EntryInvitationForm } from '@/components/entry/EntryInvitationForm';

afterEach(cleanup);

function renderEntryFlow(locale: 'zh-CN' | 'en-US') {
  return renderWithIntl(
    <ToastProvider>
      <EntryHeader />
      <EntryInvitationForm />
    </ToastProvider>,
    locale
  );
}

test('renders the onboarding header and invitation form in English', () => {
  renderEntryFlow('en-US');

  expect(screen.getByText(/Business onboarding/)).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Invitation code' })).toBeInTheDocument();
});

test('renders the onboarding header and invitation form in Chinese', () => {
  renderEntryFlow('zh-CN');

  expect(screen.getByText(/商家入驻平台/)).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: '邀请码' })).toBeInTheDocument();
});
