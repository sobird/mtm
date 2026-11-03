'use client';

import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ColumnDef, RowData } from '@tanstack/react-table';

import { cx } from '../cx';
import { Empty } from '../Empty';
import { Pagination } from '../Pagination';
import { Skeleton } from '../Skeleton';

import styles from './DataTable.module.css';

export type DataTableRowKey<T> = keyof T | ((row: T) => string);

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  rowKey: DataTableRowKey<T>;
  loading?: boolean;
  emptyText?: string;
}

export function DataTable<T extends RowData>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  rowKey,
  loading = false,
  emptyText,
}: DataTableProps<T>) {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

  // oxlint-disable-next-line react/incompatible-library -- TanStack Table instance is intentionally unmemoizable.
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
    state: {
      pagination: { pageIndex: Math.max(0, page - 1), pageSize },
    },
    getRowId: (row: T) => (typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey])),
  });

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const columnCount = Math.max(1, columns.length);
  const skeletonCount = data.length > 0 ? data.length : 5;

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            {headerGroups.map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className={styles.th} scope='col'>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonCount }, (_, rowIndex) => (
                  <tr key={`skeleton-${rowIndex}`} className={styles.tr}>
                    {Array.from({ length: columnCount }, (_cellValue, cellIndex) => (
                      <td key={cellIndex} className={styles.td}>
                        <Skeleton rows={1} />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map(row => (
                  <tr key={row.id} className={styles.tr}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className={styles.td}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
            {!loading && rows.length === 0 ? (
              <tr>
                <td className={styles.td} colSpan={columnCount}>
                  <Empty description={emptyText ?? '暂无数据'} />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        className={cx(styles.footer)}
      />
    </div>
  );
}

export default DataTable;
