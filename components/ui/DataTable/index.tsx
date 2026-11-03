'use client';

import { Table } from 'antd';
import type { TableColumnsType, TableProps } from 'antd';
import type { Key } from 'react';

import { Empty } from '../Empty';

export type DataTableColumn<T> = TableColumnsType<T>[number];
export type DataTableColumns<T> = TableColumnsType<T>;

export interface DataTableSort {
  columnKey?: string;
  order?: 'ascend' | 'descend';
}

export interface DataTableChange {
  sorter?: DataTableSort;
  filters?: Record<string, Key[] | null>;
}

export interface DataTableProps<T> {
  columns: DataTableColumns<T>;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  rowKey: TableProps<T>['rowKey'];
  loading?: boolean;
  emptyText?: string;
  /**
   * Fires for sort and filter changes. Sorting/filtering is server-side here:
   * columns use `sorter: true`, so antd renders the controls without reordering
   * the current page.
   */
  onTableChange?: (change: DataTableChange) => void;
}

export function DataTable<T extends object>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  rowKey,
  loading = false,
  emptyText,
  onTableChange,
}: DataTableProps<T>) {
  const handleChange: TableProps<T>['onChange'] = (pagination, filters, sorter, extra) => {
    if (extra.action === 'paginate') {
      const nextPage = pagination.current ?? 1;
      if (nextPage !== page) {
        onPageChange(nextPage);
      }
      return;
    }

    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    // antd only fills `columnKey` when a column has an explicit `key`, so fall
    // back to the data index for the common `dataIndex`-only columns.
    const field = activeSorter?.field;
    const rawKey = activeSorter?.columnKey ?? (Array.isArray(field) ? field[0] : field);

    onTableChange?.({
      sorter: activeSorter
        ? {
            columnKey: rawKey === undefined ? undefined : String(rawKey),
            order: activeSorter.order ?? undefined,
          }
        : undefined,
      filters: filters as Record<string, Key[] | null>,
    });
  };

  return (
    <Table<T>
      size='middle'
      rowKey={rowKey}
      columns={columns}
      dataSource={data}
      loading={loading}
      locale={{ emptyText: <Empty description={emptyText ?? '暂无数据'} /> }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: false,
        showTotal: value => `共 ${value} 条`,
      }}
      onChange={handleChange}
    />
  );
}

export default DataTable;
