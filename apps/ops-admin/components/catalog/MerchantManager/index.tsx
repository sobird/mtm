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
import { useState } from 'react';

import { apiFetch, apiFetchWithMeta } from '@/lib/api-client';

import styles from './index.module.css';

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<MerchantDTO['status'], string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'ACTIVE', label: '启用' },
  { value: 'DISABLED', label: '停用' },
];

function formatValue(value: string | null): string {
  return value && value.trim() ? value : '-';
}

function MerchantInfo({ merchant }: { merchant: MerchantDetailDTO }) {
  return (
    <div className={styles.info}>
      <p className={styles.infoRow}>编码：{merchant.code}</p>
      <p className={styles.infoRow}>名称：{merchant.name}</p>
      <p className={styles.infoRow}>
        状态：
        <Tag tone={merchant.status === 'ACTIVE' ? 'success' : 'neutral'}>{STATUS_LABELS[merchant.status]}</Tag>
      </p>
      <p className={styles.infoRow}>联系人：{formatValue(merchant.contactName)}</p>
      <p className={styles.infoRow}>联系电话：{formatValue(merchant.contactPhone)}</p>
    </div>
  );
}

const SHOP_COLUMNS: DataTableColumns<ShopDTO> = [
  {
    dataIndex: 'name',
    title: '店铺名称',
  },
  {
    key: 'address',
    title: '地址',
    render: (_, shop) => formatValue(shop.address),
  },
  {
    key: 'status',
    title: '状态',
    width: 100,
    render: (_, shop) => (
      <Tag tone={shop.status === 'ACTIVE' ? 'success' : 'neutral'}>{STATUS_LABELS[shop.status]}</Tag>
    ),
  },
  {
    key: 'contactPhone',
    title: '联系电话',
    render: (_, shop) => formatValue(shop.contactPhone),
  },
];

function MerchantDetailDialog({ merchantId, onClose }: { merchantId: string | null; onClose: () => void }) {
  const detailQuery = useQuery({
    queryKey: ['ops', 'merchants', merchantId],
    queryFn: () => apiFetch<MerchantDetailDTO>(`/api/bff/merchants/${merchantId}`),
    enabled: merchantId !== null,
  });

  const merchant = detailQuery.data;
  const shops = merchant?.shops ?? [];

  return (
    <Dialog
      open={merchantId !== null}
      onOpenChange={open => {
        if (!open) onClose();
      }}
      title='商家详情'
      description={merchant ? `商家：${merchant.name}` : undefined}
    >
      {detailQuery.isPending ? <Skeleton rows={4} /> : null}

      {detailQuery.isError ? <Empty description='加载失败' /> : null}

      {merchant ? (
        <>
          <MerchantInfo merchant={merchant} />
          <h3 className={styles.shopTitle}>店铺</h3>
          <DataTable
            columns={SHOP_COLUMNS}
            data={shops}
            total={shops.length}
            page={1}
            pageSize={Math.max(shops.length, 10)}
            onPageChange={() => {}}
            rowKey='id'
            emptyText='暂无店铺'
          />
        </>
      ) : null}
    </Dialog>
  );
}

export function MerchantManager() {
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
      title: '编码',
      width: 120,
    },
    {
      dataIndex: 'name',
      title: '名称',
    },
    {
      key: 'contactName',
      title: '联系人',
      render: (_, row) => formatValue(row.contactName),
    },
    {
      key: 'contactPhone',
      title: '联系电话',
      render: (_, row) => formatValue(row.contactPhone),
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (_, row) => <Tag tone={row.status === 'ACTIVE' ? 'success' : 'neutral'}>{STATUS_LABELS[row.status]}</Tag>,
    },
    {
      key: 'actions',
      title: '操作',
      width: 100,
      render: (_, row) => (
        <div className={styles.actions}>
          <Button variant='ghost' size='sm' onClick={() => setDetailId(row.id)}>
            查看
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title='商家管理' description='查看商家资料与店铺信息。'>
      <div className={styles.toolbar}>
        <SearchForm onSubmit={applyFilters} onReset={resetFilters}>
          <Field label='关键字'>
            <Input
              aria-label='关键字'
              placeholder='商家编码/名称'
              value={draftKeyword}
              onChange={event => setDraftKeyword(event.target.value)}
            />
          </Field>
          <Field label='状态'>
            <Select
              aria-label='商家状态筛选'
              options={STATUS_FILTER_OPTIONS}
              value={draftStatus}
              onChange={value => setDraftStatus(String(value))}
            />
          </Field>
        </SearchForm>
      </div>

      {merchantsQuery.isError ? (
        <Empty description='加载失败' />
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
          emptyText='暂无商家'
        />
      )}

      <MerchantDetailDialog merchantId={detailId} onClose={() => setDetailId(null)} />
    </PageContainer>
  );
}

export default MerchantManager;
