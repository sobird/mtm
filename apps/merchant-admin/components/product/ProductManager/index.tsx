'use client';

import type { ProductListRowDTO, ProductVersionStatus } from '@mtm/contracts';
import { PERMISSIONS } from '@mtm/contracts';
import { Can, PermissionButton } from '@mtm/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { PageContainer } from '@/components/layout/PageContainer';
import { Button, DataTable, Empty, Field, Input, SearchForm, Select, Tag, useToast } from '@/components/ui';
import type { DataTableColumns, SelectOptionValue, TagTone } from '@/components/ui';
import { ApiError } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { deleteProduct, fetchProducts, offlineProduct, publishProduct, submitProduct } from '@/lib/services/products';
import type { ProductListParams } from '@/lib/services/products';

import styles from './index.module.css';

const PAGE_SIZE = 10;

const STATUS_META: Record<ProductVersionStatus, { label: string; tone: TagTone }> = {
  DRAFT: { label: '草稿', tone: 'neutral' },
  SUBMITTED: { label: '审核中', tone: 'warning' },
  APPROVED: { label: '已通过', tone: 'success' },
  REJECTED: { label: '已驳回', tone: 'danger' },
  PUBLISHED: { label: '已发布', tone: 'success' },
  SUPERSEDED: { label: '已被替换', tone: 'neutral' },
  OFFLINE: { label: '已下线', tone: 'danger' },
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'SUBMITTED', label: '审核中' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已驳回' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'OFFLINE', label: '已下线' },
];

const EDITABLE_STATUSES = new Set<ProductVersionStatus>(['DRAFT', 'REJECTED', 'OFFLINE']);

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

export function ProductManager() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<SelectOptionValue>('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStatus, setDraftStatus] = useState<SelectOptionValue>('');

  const params: ProductListParams = {
    page,
    pageSize: PAGE_SIZE,
    keyword: keyword || undefined,
    status: status ? (status as ProductVersionStatus) : undefined,
  };

  const productsQuery = useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => fetchProducts(params),
  });

  const onRequestError = (error: unknown) => {
    toast.error(error instanceof ApiError ? error.message : '操作失败，请稍后重试');
  };

  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: ['products'] });

  const submitMutation = useMutation({
    mutationFn: submitProduct,
    onSuccess: async () => {
      toast.success('已提交审核');
      await invalidateProducts();
    },
    onError: onRequestError,
  });

  const publishMutation = useMutation({
    mutationFn: publishProduct,
    onSuccess: async () => {
      toast.success('商品已发布');
      await invalidateProducts();
    },
    onError: onRequestError,
  });

  const offlineMutation = useMutation({
    mutationFn: offlineProduct,
    onSuccess: async () => {
      toast.success('商品已下线');
      await invalidateProducts();
    },
    onError: onRequestError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: async () => {
      toast.success('商品已删除');
      await invalidateProducts();
    },
    onError: onRequestError,
  });

  const applyFilters = () => {
    setPage(1);
    setKeyword(draftKeyword.trim());
    setStatus(draftStatus);
  };

  const resetFilters = () => {
    setDraftKeyword('');
    setDraftStatus('');
    setKeyword('');
    setStatus('');
    setPage(1);
  };

  const renderActions = (row: ProductListRowDTO) => (
    <div className={styles.actions}>
      {EDITABLE_STATUSES.has(row.status) ? (
        <Can permission={PERMISSIONS.PRODUCT_UPDATE}>
          <Button variant='ghost' size='sm' onClick={() => router.push(`/products/${row.id}/edit`)}>
            编辑
          </Button>
        </Can>
      ) : null}

      {row.status === 'SUBMITTED' ? (
        <Button variant='ghost' size='sm' disabled>
          审核中
        </Button>
      ) : null}

      {row.status === 'APPROVED' ? (
        <Can permission={PERMISSIONS.PRODUCT_PUBLISH}>
          <Button variant='ghost' size='sm' onClick={() => publishMutation.mutate(row.id)}>
            发布
          </Button>
        </Can>
      ) : null}

      {row.status === 'PUBLISHED' ? (
        <Can permission={PERMISSIONS.PRODUCT_PUBLISH}>
          <Button variant='ghost' size='sm' onClick={() => offlineMutation.mutate(row.id)}>
            下线
          </Button>
        </Can>
      ) : null}

      {row.status === 'DRAFT' ? (
        <>
          <Can permission={PERMISSIONS.PRODUCT_SUBMIT}>
            <Button variant='ghost' size='sm' onClick={() => submitMutation.mutate(row.id)}>
              提交审核
            </Button>
          </Can>
          <Can permission={PERMISSIONS.PRODUCT_DELETE}>
            <Button variant='ghost' size='sm' onClick={() => deleteMutation.mutate(row.id)}>
              删除
            </Button>
          </Can>
        </>
      ) : null}
    </div>
  );

  const columns: DataTableColumns<ProductListRowDTO> = [
    {
      key: 'product',
      title: '商品',
      render: (_, row) => (
        <div className={styles.product}>
          <img className={styles.thumbnail} src={row.mainImageUrl} alt={row.title} />
          <span className={styles.title}>{row.title}</span>
        </div>
      ),
    },
    {
      dataIndex: 'code',
      title: '编码',
    },
    {
      dataIndex: 'categoryName',
      title: '类目',
    },
    {
      dataIndex: 'status',
      title: '状态',
      render: (value: ProductVersionStatus) => {
        const meta = STATUS_META[value];

        return meta ? <Tag tone={meta.tone}>{meta.label}</Tag> : <span className={styles.muted}>--</span>;
      },
    },
    {
      dataIndex: 'version',
      title: '版本',
      render: (value: number) => `V${value}`,
    },
    {
      dataIndex: 'updatedAt',
      title: '更新时间',
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_, row) => renderActions(row),
    },
  ];

  const list = productsQuery.data?.data ?? [];

  return (
    <PageContainer
      title='商品列表'
      description='管理店铺商品、提交审核与发布。'
      actions={
        <PermissionButton permission={PERMISSIONS.PRODUCT_CREATE} onClick={() => router.push('/products/new')}>
          新建商品
        </PermissionButton>
      }
    >
      <div className={styles.toolbar}>
        <SearchForm onSubmit={applyFilters} onReset={resetFilters}>
          <Field label='关键字'>
            <Input
              aria-label='关键字'
              placeholder='商品标题或编码'
              value={draftKeyword}
              onChange={event => setDraftKeyword(event.target.value)}
            />
          </Field>
          <Field label='状态'>
            <Select
              aria-label='商品状态筛选'
              options={STATUS_FILTER_OPTIONS}
              value={draftStatus}
              onChange={value => setDraftStatus(value)}
            />
          </Field>
        </SearchForm>
      </div>

      {productsQuery.isError ? (
        <Empty description='加载失败' />
      ) : (
        <DataTable
          columns={columns}
          data={list}
          total={productsQuery.data?.meta?.total ?? list.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          rowKey='id'
          loading={productsQuery.isPending}
          emptyText='暂无商品'
        />
      )}
    </PageContainer>
  );
}

export default ProductManager;
