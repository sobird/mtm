import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';

import { DataTable } from '@/components/ui/DataTable';

const rows = Array.from({ length: 10 }, (_, i) => ({ id: String(i), name: `row-${i}` }));

test('renders the current page and total', () => {
  render(
    <DataTable
      columns={[{ dataIndex: 'name', title: '名称' }]}
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

test('reports pagination changes through onPageChange', async () => {
  const user = userEvent.setup();
  const onPageChange = vi.fn();

  const { container } = render(
    <DataTable
      columns={[{ dataIndex: 'name', title: '名称' }]}
      data={rows}
      total={25}
      page={1}
      pageSize={10}
      onPageChange={onPageChange}
      rowKey='id'
    />
  );

  const secondPage = container.querySelector<HTMLElement>('.ant-pagination-item-2');
  expect(secondPage).not.toBeNull();
  await user.click(secondPage as HTMLElement);

  await waitFor(() => {
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

test('reports server-side sort changes through onTableChange', async () => {
  const user = userEvent.setup();
  const onTableChange = vi.fn();

  const { container } = render(
    <DataTable
      columns={[{ dataIndex: 'name', title: '名称', sorter: true }]}
      data={rows}
      total={25}
      page={1}
      pageSize={10}
      onPageChange={() => {}}
      onTableChange={onTableChange}
      rowKey='id'
    />
  );

  const sortableHeader = container.querySelector<HTMLElement>('th.ant-table-column-has-sorters');
  expect(sortableHeader).not.toBeNull();
  await user.click(sortableHeader as HTMLElement);

  await waitFor(() => {
    expect(onTableChange).toHaveBeenCalledWith(
      expect.objectContaining({ sorter: expect.objectContaining({ columnKey: 'name', order: 'ascend' }) })
    );
  });
});
