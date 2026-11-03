'use client';

import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';

import { Button, Card, DataTable, Empty, Tag, Tooltip, useToast } from '@/components/ui';
import type { TagTone } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { LicenseDTO } from '@/lib/services/merchant';

import { display } from '../display';

import styles from './LicenseList.module.css';

const PAGE_SIZE = 10;

const STATUS_MAP: Record<number, { label: string; tone: TagTone }> = {
  4: { label: '审核中', tone: 'warning' },
  5: { label: '审核驳回', tone: 'danger' },
  6: { label: '审核通过', tone: 'success' },
};

function isExpired(expireAt: string | null | undefined): boolean {
  if (!expireAt) {
    return false;
  }

  const time = new Date(expireAt).getTime();

  return Number.isFinite(time) && time < Date.now();
}

export function LicenseList() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const licensesQuery = useQuery({
    queryKey: queryKeys.licenses,
    queryFn: () => apiFetch<LicenseDTO[]>('/api/merchant/licenses'),
  });

  const placeholder = () => {
    toast.info('功能即将上线');
  };

  const list = licensesQuery.data ?? [];

  const columns: ColumnDef<LicenseDTO>[] = [
    {
      accessorKey: 'type',
      header: '证照类型',
      cell: ({ row }) => display(row.original.type),
    },
    {
      id: 'url',
      header: '许可证照',
      cell: ({ row }) => (
        <Button
          variant='ghost'
          size='sm'
          disabled={!row.original.url}
          onClick={() => {
            if (row.original.url) {
              window.open(row.original.url, '_blank', 'noopener');
            }
          }}
        >
          证照预览
        </Button>
      ),
    },
    {
      accessorKey: 'expireAt',
      header: '证照有效截止日期',
      cell: ({ row }) => (
        <span>
          {display(row.original.expireAt)}
          {isExpired(row.original.expireAt) ? <span className={styles.expired}>已过期</span> : null}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: '审核状态',
      cell: ({ row }) => {
        const status = STATUS_MAP[row.original.status];

        return status ? <Tag tone={status.tone}>{status.label}</Tag> : <span>--</span>;
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const { status, expireAt } = row.original;

        if (status === 4) {
          return (
            <Tooltip content='审核中，暂时不支持删除'>
              <span>
                <Button variant='ghost' size='sm' disabled aria-label='删除证照'>
                  删除
                </Button>
              </span>
            </Tooltip>
          );
        }

        if (status === 5) {
          return (
            <div className={styles.actions}>
              <Button variant='ghost' size='sm' onClick={placeholder}>
                修改
              </Button>
              <Button variant='ghost' size='sm' onClick={placeholder}>
                删除
              </Button>
            </div>
          );
        }

        if (status === 6 && !isExpired(expireAt)) {
          return (
            <Tooltip content='当前许可证件正在使用中，暂时不支持删除'>
              <span>
                <Button variant='ghost' size='sm' disabled aria-label='删除证照'>
                  删除
                </Button>
              </span>
            </Tooltip>
          );
        }

        if (status === 6 && isExpired(expireAt)) {
          return (
            <Button variant='ghost' size='sm' onClick={placeholder}>
              删除
            </Button>
          );
        }

        return <span>--</span>;
      },
    },
  ];

  return (
    <Card
      title='许可证列表'
      extra={
        <Button variant='secondary' size='sm' onClick={placeholder}>
          添加证照
        </Button>
      }
    >
      {licensesQuery.isError ? (
        <Empty description='加载失败' />
      ) : (
        <DataTable
          columns={columns}
          data={list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
          total={list.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          rowKey='id'
          loading={licensesQuery.isPending}
          emptyText='暂无许可证'
        />
      )}
    </Card>
  );
}

export default LicenseList;
