'use client';

import type { ProductListRowDTO, ProductVersionStatus } from '@mtm/contracts';
import { PERMISSIONS } from '@mtm/contracts';
import { Can, PermissionButton, usePermissions } from '@mtm/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { PageContainer } from '@/components/layout/PageContainer';
import { Button, DataTable, Dialog, Empty, Field, Input, SearchForm, Select, Tag, useToast } from '@/components/ui';
import type { DataTableColumns, SelectOptionValue, TagTone } from '@/components/ui';
import { queryKeys } from '@/lib/query-keys';
import { deleteProduct, fetchProducts, offlineProduct, publishProduct, submitProduct } from '@/lib/services/products';
import type { ProductListParams } from '@/lib/services/products';
import { translateApiError } from '@/lib/translate-api-error';

import styles from './index.module.css';

const PAGE_SIZE = 10;

const STATUS_TONES: Record<ProductVersionStatus, TagTone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  PUBLISHED: 'success',
  SUPERSEDED: 'neutral',
  OFFLINE: 'danger',
};

const STATUS_FILTER_VALUES: ProductVersionStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'PUBLISHED',
  'OFFLINE',
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
  const permissions = usePermissions();
  const t = useTranslations('product');
  const tCommon = useTranslations('common');
  const tRoot = useTranslations();
  const canUpdate = permissions.has(PERMISSIONS.PRODUCT_UPDATE);

  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<SelectOptionValue>('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStatus, setDraftStatus] = useState<SelectOptionValue>('');
  const [pendingDelete, setPendingDelete] = useState<ProductListRowDTO | null>(null);

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
    toast.error(translateApiError(error, tRoot, 'product.toast.actionFailed'));
  };

  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: ['products'] });

  const submitMutation = useMutation({
    mutationFn: submitProduct,
    onSuccess: async () => {
      toast.success(t('toast.submitted'));
      await invalidateProducts();
    },
    onError: onRequestError,
  });

  const publishMutation = useMutation({
    mutationFn: publishProduct,
    onSuccess: async () => {
      toast.success(t('toast.published'));
      await invalidateProducts();
    },
    onError: onRequestError,
  });

  const offlineMutation = useMutation({
    mutationFn: offlineProduct,
    onSuccess: async () => {
      toast.success(t('toast.offline'));
      await invalidateProducts();
    },
    onError: onRequestError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: async () => {
      setPendingDelete(null);
      toast.success(t('toast.deleted'));
      await invalidateProducts();
    },
    onError: onRequestError,
  });

  const confirmDelete = () => {
    if (pendingDelete) {
      deleteMutation.mutate(pendingDelete.id);
    }
  };

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

  const statusFilterOptions = [
    { value: '', label: t('list.allStatuses') },
    ...STATUS_FILTER_VALUES.map(value => ({ value, label: t('status.' + value) })),
  ];

  const renderActions = (row: ProductListRowDTO) => (
    <div className={styles.actions}>
      {EDITABLE_STATUSES.has(row.status) && canUpdate ? (
        <Button variant='ghost' size='sm' onClick={() => router.push(`/products/${row.id}`)}>
          {tCommon('edit')}
        </Button>
      ) : (
        <Button variant='ghost' size='sm' onClick={() => router.push(`/products/${row.id}`)}>
          {t('actions.view')}
        </Button>
      )}

      {row.status === 'APPROVED' ? (
        <Can permission={PERMISSIONS.PRODUCT_PUBLISH}>
          <Button variant='ghost' size='sm' onClick={() => publishMutation.mutate(row.id)}>
            {t('actions.publish')}
          </Button>
        </Can>
      ) : null}

      {row.status === 'PUBLISHED' ? (
        <Can permission={PERMISSIONS.PRODUCT_PUBLISH}>
          <Button variant='ghost' size='sm' onClick={() => offlineMutation.mutate(row.id)}>
            {t('actions.offline')}
          </Button>
        </Can>
      ) : null}

      {row.status === 'DRAFT' ? (
        <>
          <Can permission={PERMISSIONS.PRODUCT_SUBMIT}>
            <Button variant='ghost' size='sm' onClick={() => submitMutation.mutate(row.id)}>
              {t('actions.submit')}
            </Button>
          </Can>
          <Can permission={PERMISSIONS.PRODUCT_DELETE}>
            <Button variant='ghost' size='sm' onClick={() => setPendingDelete(row)}>
              {tCommon('delete')}
            </Button>
          </Can>
        </>
      ) : null}
    </div>
  );

  const columns: DataTableColumns<ProductListRowDTO> = [
    {
      key: 'product',
      title: t('list.productColumn'),
      render: (_, row) => (
        <div className={styles.product}>
          <img className={styles.thumbnail} src={row.mainImageUrl} alt={row.title} />
          <span className={styles.title}>{row.title}</span>
        </div>
      ),
    },
    {
      dataIndex: 'code',
      title: t('list.code'),
    },
    {
      dataIndex: 'categoryName',
      title: t('list.category'),
    },
    {
      dataIndex: 'status',
      title: t('list.status'),
      render: (value: ProductVersionStatus) => {
        const tone = STATUS_TONES[value];

        return tone ? <Tag tone={tone}>{t('status.' + value)}</Tag> : <span className={styles.muted}>--</span>;
      },
    },
    {
      dataIndex: 'version',
      title: t('list.version'),
      render: (value: number) => `V${value}`,
    },
    {
      dataIndex: 'updatedAt',
      title: t('list.updatedAt'),
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'actions',
      title: tCommon('actions'),
      render: (_, row) => renderActions(row),
    },
  ];

  const list = productsQuery.data?.data ?? [];

  return (
    <PageContainer
      title={t('list.title')}
      description={t('list.description')}
      actions={
        <PermissionButton
          permission={PERMISSIONS.PRODUCT_CREATE}
          data-testid='product-create'
          onClick={() => router.push('/products/new')}
        >
          {t('list.create')}
        </PermissionButton>
      }
    >
      <div className={styles.toolbar}>
        <SearchForm onSubmit={applyFilters} onReset={resetFilters}>
          <Field label={t('list.keyword')}>
            <Input
              aria-label={t('list.keyword')}
              placeholder={t('list.keywordPlaceholder')}
              value={draftKeyword}
              onChange={event => setDraftKeyword(event.target.value)}
            />
          </Field>
          <Field label={t('list.status')}>
            <Select
              aria-label={t('list.statusFilter')}
              options={statusFilterOptions}
              value={draftStatus}
              onChange={value => setDraftStatus(value)}
            />
          </Field>
        </SearchForm>
      </div>

      {productsQuery.isError ? (
        <Empty description={t('list.loadFailed')} />
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
          emptyText={t('list.empty')}
        />
      )}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={open => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        title={t('deleteDialog.title')}
        description={
          pendingDelete
            ? t('deleteDialog.description', { title: pendingDelete.title, code: pendingDelete.code })
            : undefined
        }
        footer={
          <>
            <Button variant='ghost' onClick={() => setPendingDelete(null)}>
              {tCommon('cancel')}
            </Button>
            <Button variant='danger' loading={deleteMutation.isPending} onClick={confirmDelete}>
              {t('deleteDialog.confirm')}
            </Button>
          </>
        }
      />
    </PageContainer>
  );
}

export default ProductManager;
