import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';

import { ToastProvider, useToast } from '@/components/ui/Toast';

function Trigger() {
  const toast = useToast();
  return <button onClick={() => toast.success('已保存')}>go</button>;
}

test('shows a success toast', async () => {
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>
  );
  await userEvent.click(screen.getByText('go'));
  expect(await screen.findByText('已保存')).toBeInTheDocument();
});
