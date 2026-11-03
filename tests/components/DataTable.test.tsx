import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { DataTable } from '@/components/ui/DataTable';

const rows = Array.from({ length: 10 }, (_, i) => ({ id: String(i), name: `row-${i}` }));

test('renders the current page and total', () => {
  render(
    <DataTable
      columns={[{ accessorKey: 'name', header: '名称' }]}
      data={rows}
      total={25}
      page={1}
      pageSize={10}
      onPageChange={() => {}}
      rowKey='id'
    />
  );
  expect(screen.getByText('row-0')).toBeInTheDocument();
  expect(screen.getByText('共 25 条')).toBeInTheDocument();
  expect(screen.queryByText('row-10')).not.toBeInTheDocument();
});
