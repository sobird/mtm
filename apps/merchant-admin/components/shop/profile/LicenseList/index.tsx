'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button, Card, DataTable, Empty, Tag, Tooltip, useToast } from '@/components/ui';
import type { DataTableColumns, TagTone } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { LicenseDTO } from '@/lib/services/merchant';

import { display } from '../display';

import styles from './LicenseList.module.css';

const PAGE_SIZE = 10;

const STATUS_MAP: Record<number, { labelKey: string; tone: TagTone }> = {
  4: { labelKey: 'statuses.reviewing', tone: 'warning' },
  5: { labelKey: 'statuses.rejected', tone: 'danger' },
  6: { labelKey: 'statuses.approved', tone: 'success' },
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
  const t = useTranslations('shop.license');
  const tCommon = useTranslations('common');
  const [page, setPage] = useState(1);
  const licensesQuery = useQuery({
    queryKey: queryKeys.licenses,
    queryFn: () => apiFetch<LicenseDTO[]>('/api/merchant/licenses'),
  });

  const placeholder = () => {
    toast.info(tCommon('comingSoon'));
  };

  const list = licensesQuery.data ?? [];

  const columns: DataTableColumns<LicenseDTO> = [
    {
      dataIndex: 'type',
      title: t('type'),
      render: (_, row) => display(row.type),
    },
    {
      key: 'url',
      title: t('file'),
      render: (_, row) => (
        <Button
          variant='ghost'
          size='sm'
          disabled={!row.url}
          onClick={() => {
            if (row.url) {
              window.open(row.url, '_blank', 'noopener');
            }
          }}
        >
          {t('preview')}
        </Button>
      ),
    },
    {
      dataIndex: 'expireAt',
      title: t('expireAt'),
      render: (_, row) => (
        <span>
          {display(row.expireAt)}
          {isExpired(row.expireAt) ? <span className={styles.expired}>{t('expired')}</span> : null}
        </span>
      ),
    },
    {
      dataIndex: 'status',
      title: t('status'),
      render: (_, row) => {
        const status = STATUS_MAP[row.status];

        return status ? <Tag tone={status.tone}>{t(status.labelKey)}</Tag> : <span>--</span>;
      },
    },
    {
      key: 'actions',
      title: tCommon('actions'),
      render: (_, row) => {
        const { status, expireAt } = row;

        if (status === 4) {
          return (
            <Tooltip content={t('reviewingDelete')}>
              <span>
                <Button variant='ghost' size='sm' disabled aria-label={t('deleteLabel')}>
                  {tCommon('delete')}
                </Button>
              </span>
            </Tooltip>
          );
        }

        if (status === 5) {
          return (
            <div className={styles.actions}>
              <Button variant='ghost' size='sm' onClick={placeholder}>
                {tCommon('edit')}
              </Button>
              <Button variant='ghost' size='sm' onClick={placeholder}>
                {tCommon('delete')}
              </Button>
            </div>
          );
        }

        if (status === 6 && !isExpired(expireAt)) {
          return (
            <Tooltip content={t('approvedDelete')}>
              <span>
                <Button variant='ghost' size='sm' disabled aria-label={t('deleteLabel')}>
                  {tCommon('delete')}
                </Button>
              </span>
            </Tooltip>
          );
        }

        if (status === 6 && isExpired(expireAt)) {
          return (
            <Button variant='ghost' size='sm' onClick={placeholder}>
              {tCommon('delete')}
            </Button>
          );
        }

        return <span>--</span>;
      },
    },
  ];

  return (
    <Card
      title={t('title')}
      extra={
        <Button variant='secondary' size='sm' onClick={placeholder}>
          {t('add')}
        </Button>
      }
    >
      {licensesQuery.isError ? (
        <Empty description={tCommon('loadFailed')} />
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
          emptyText={t('empty')}
        />
      )}
    </Card>
  );
}

export default LicenseList;
