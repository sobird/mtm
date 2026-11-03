import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { Button } from '../src';

test('package exposes the shared primitives', () => {
  render(<Button>确定</Button>);
  expect(screen.getByRole('button', { name: '确定' })).toBeInTheDocument();
});
