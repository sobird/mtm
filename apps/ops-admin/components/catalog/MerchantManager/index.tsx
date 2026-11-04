'use client';

import type { MerchantDetailDTO, MerchantDTO, ShopDTO } from '@mtm/contracts';
import {
  Button,
  DataTable,
  Dialog,
  Empty,
  Field,
  Input,
  PageContainer,
  SearchForm,
  Select,
  Skeleton,
  Tag,
} from '@mtm/ui';
import type { DataTableColumns } from '@mtm/ui';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { apiFetch, apiFetchWithMeta } from '@/lib/api-client';

import styles from './index.module.css';

const PAGE_SIZE = 10;

function formatValue(value: string | null): string {
  return value && value.trim() ? value : '-';
}

function MerchantInfo({ merchant }: { merchant: MerchantDetailDTO }) {
  const t = useTranslations('catalog.merchants');
  const tStatus = useTranslations('opsCommon.status');

  return (
    <div className={styles.info}>
      <p className={styles.infoRow}>{t('detail.code', { value: merchant.code })}</p>
      <p className={styles.infoRow}>{t('detail.name', { value: merchant.name })}</p>
      <p className={styles.infoRow}>
        {t('detail.status')}
        <Tag tone={merchant.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {tStatus(merchant.status === 'ACTIVE' ? 'active' : 'disabled')}
        </Tag>
      </p>
      <p className={styles.infoRow}>{t('detail.contactName', { value: formatValue(merchant.contactName) })}</p>
      <p className={styles.infoRow}>{t('detail.contactPhone', { value: formatValue(merchant.contactPhone) })}</p>
    </div>
  );
}

function MerchantDetailDialog({ merchantId, onClose }: { merchantId: string | null; onClose: () => void }) {
  const t = useTranslations('catalog.merchants');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('opsCommon.status');

  const detailQuery = useQuery({
    queryKey: ['ops', 'merchants', merchantId],
    queryFn: () => apiFetch<MerchantDetailDTO>(`/api/bff/merchants/${merchantId}`),
    enabled: merchantId !== null,
  });

  const merchant = detailQuery.data;
  const shops = merchant?.shops ?? [];

  const shopColumns: DataTableColumns<ShopDTO> = [
    {
      dataIndex: 'name',
      title: t('shopColumns.name'),
    },
    {
      key: 'address',
      title: t('shopColumns.address'),
      render: (_, shop) => formatValue(shop.address),
    },
    {
      key: 'status',
      title: t('shopColumns.status'),
      width: 100,
      render: (_, shop) => (
        <Tag tone={shop.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {tStatus(shop.status === 'ACTIVE' ? 'active' : 'disabled')}
        </Tag>
      ),
    },
    {
      key: 'contactPhone',
      title: t('shopColumns.contactPhone'),
      render: (_, shop) => formatValue(shop.contactPhone),
    },
  ];

  return (
    <Dialog
      open={merchantId !== null}
      onOpenChange={open => {
        if (!open) onClose();
      }}
      title={t('detail.title')}
      description={merchant ? t('detail.description', { name: merchant.name }) : undefined}
    >
      {detailQuery.isPending ? <Skeleton rows={4} /> : null}

      {detailQuery.isError ? <Empty description={tCommon('loadFailed')} /> : null}

      {merchant ? (
        <>
          <MerchantInfo merchant={merchant} />
          <h3 className={styles.shopTitle}>{t('detail.shops')}</h3>
          <DataTable
            columns={shopColumns}
            data={shops}
            total={shops.length}
            page={1}
            pageSize={Math.max(shops.length, 10)}
            onPageChange={() => {}}
            rowKey='id'
            emptyText={t('detail.emptyShops')}
          />
        </>
      ) : null}
    </Dialog>
  );
}

export function MerchantManager() {
  const t = useTranslations('catalog.merchants');
  const tCommon = useTranslations('common');
  const tOps = useTranslations('opsCommon');
  const tStatus = useTranslations('opsCommon.status');

  const statusFilterOptions = [
    { value: '', label: tOps('all') },
    { value: 'ACTIVE', label: tStatus('active') },
    { value: 'DISABLED', label: tStatus('disabled') },
  ];

  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStatus, setDraftStatus] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  const params = {
    page,
    pageSize: PAGE_SIZE,
    keyword: keyword || undefined,
    status: status || undefined,
  };

  const merchantsQuery = useQuery({
    queryKey: ['ops', 'merchants', params],
    queryFn: () => apiFetchWithMeta<MerchantDTO[]>('/api/bff/merchants', { query: params }),
  });

  const applyFilters = () => {
    setKeyword(draftKeyword);
    setStatus(draftStatus);
    setPage(1);
  };

  const resetFilters = () => {
    setDraftKeyword('');
    setDraftStatus('');
    setKeyword('');
    setStatus('');
    setPage(1);
  };

  const merchants = merchantsQuery.data?.data ?? [];
  const total = merchantsQuery.data?.meta?.total ?? merchants.length;

  const columns: DataTableColumns<MerchantDTO> = [
    {
      dataIndex: 'code',
      title: t('columns.code'),
      width: 120,
    },
    {
      dataIndex: 'name',
      title: t('columns.name'),
    },
    {
      key: 'contactName',
      title: t('columns.contactName'),
      render: (_, row) => formatValue(row.contactName),
    },
    {
      key: 'contactPhone',
      title: t('columns.contactPhone'),
      render: (_, row) => formatValue(row.contactPhone),
    },
    {
      key: 'status',
      title: t('columns.status'),
      width: 100,
      render: (_, row) => (
        <Tag tone={row.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {tStatus(row.status === 'ACTIVE' ? 'active' : 'disabled')}
        </Tag>
      ),
    },
    {
      key: 'actions',
      title: t('columns.actions'),
      width: 100,
      render: (_, row) => (
        <div className={styles.actions}>
          <Button variant='ghost' size='sm' onClick={() => setDetailId(row.id)}>
            {tCommon('view')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title={t('title')} description={t('description')}>
      <div className={styles.toolbar}>
        <SearchForm onSubmit={applyFilters} onReset={resetFilters}>
          <Field label={t('fields.keyword')}>
            <Input
              aria-label={t('fields.keyword')}
              placeholder={t('fields.keywordPlaceholder')}
              value={draftKeyword}
              onChange={event => setDraftKeyword(event.target.value)}
            />
          </Field>
          <Field label={t('fields.status')}>
            <Select
              aria-label={t('fields.statusFilter')}
              options={statusFilterOptions}
              value={draftStatus}
              onChange={value => setDraftStatus(String(value))}
            />
          </Field>
        </SearchForm>
      </div>

      {merchantsQuery.isError ? (
        <Empty description={tCommon('loadFailed')} />
      ) : (
        <DataTable
          columns={columns}
          data={merchants}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          rowKey='id'
          loading={merchantsQuery.isPending}
          emptyText={t('empty')}
        />
      )}

      <MerchantDetailDialog merchantId={detailId} onClose={() => setDetailId(null)} />
    </PageContainer>
  );
}

export default MerchantManager;
