'use client';

import type {
  AuditQuery,
  AuditRecordDTO,
  CategoryNodeDTO,
  ProductAuditStatus,
  ProductDetailDTO,
  ProductVersionDTO,
  SkuDTO,
} from '@mtm/contracts';
import {
  Button,
  DataTable,
  Dialog,
  Empty,
  Field,
  Input,
  LabelValue,
  PageContainer,
  SearchForm,
  Select,
  Skeleton,
  Tag,
  Textarea,
  useToast,
} from '@mtm/ui';
import type { DataTableColumns, TagTone } from '@mtm/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { apiFetch, apiFetchWithMeta } from '@/lib/api-client';
import { translateApiError } from '@/lib/translate-api-error';

import styles from './index.module.css';

const PAGE_SIZE = 10;

const STATUS_TONES: Record<ProductAuditStatus, TagTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function formatSpecs(specs: Record<string, string>, separator: string, specLabel: string): string {
  const entries = Object.entries(specs ?? {});

  return entries.length
    ? entries
        .map(([key, value]) => {
          const label = key === 'spec' || key === '规格' ? specLabel : key;

          return `${label}${separator}${value}`;
        })
        .join(' / ')
    : '-';
}

function StatusTag({ status }: { status: ProductAuditStatus }) {
  const t = useTranslations('audit.status');
  const tone = STATUS_TONES[status];

  return tone ? <Tag tone={tone}>{t(status)}</Tag> : <span className={styles.muted}>--</span>;
}

function VersionContent({
  version,
  attributeNames,
}: {
  version: ProductVersionDTO;
  attributeNames: Record<string, string>;
}) {
  const t = useTranslations('audit');
  const tStatus = useTranslations('opsCommon.status');
  const attributeEntries = Object.entries(version.attributes ?? {});

  const skuColumns: DataTableColumns<SkuDTO> = [
    {
      dataIndex: 'skuCode',
      title: t('skuColumns.code'),
    },
    {
      key: 'specs',
      title: t('skuColumns.specs'),
      render: (_, sku) => formatSpecs(sku.specs, t('specSeparator'), t('skuColumns.specs')),
    },
    {
      dataIndex: 'price',
      title: t('skuColumns.price'),
      width: 120,
    },
    {
      dataIndex: 'stock',
      title: t('skuColumns.stock'),
      width: 100,
    },
    {
      key: 'status',
      title: t('skuColumns.status'),
      width: 100,
      render: (_, sku) => (
        <Tag tone={sku.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {tStatus(sku.status === 'ACTIVE' ? 'active' : 'disabled')}
        </Tag>
      ),
    },
  ];

  return (
    <div className={styles.version}>
      <div className={styles.mainImage}>
        <img className={styles.image} src={version.mainImageUrl} alt={version.title} />
      </div>

      <p className={styles.description}>{version.description || t('version.noDescription')}</p>

      <h4 className={styles.subTitle}>{t('version.attributes')}</h4>
      {attributeEntries.length ? (
        <div className={styles.attributes}>
          {attributeEntries.map(([key, value]) => (
            <LabelValue key={key} label={attributeNames[key] ?? key}>
              {value || '-'}
            </LabelValue>
          ))}
        </div>
      ) : (
        <p className={styles.muted}>{t('version.noAttributes')}</p>
      )}

      <h4 className={styles.subTitle}>{t('version.sku')}</h4>
      <DataTable
        columns={skuColumns}
        data={version.skus ?? []}
        total={version.skus?.length ?? 0}
        page={1}
        pageSize={Math.max(version.skus?.length ?? 0, 10)}
        onPageChange={() => {}}
        rowKey='id'
        emptyText={t('version.noSku')}
      />
    </div>
  );
}

export function AuditManager() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('audit');
  const tCommon = useTranslations('common');
  const tOps = useTranslations('opsCommon');
  const tStatus = useTranslations('audit.status');
  const tRoot = useTranslations();

  const statusFilterOptions = [
    { value: '', label: tOps('all') },
    { value: 'PENDING', label: tStatus('PENDING') },
    { value: 'APPROVED', label: tStatus('APPROVED') },
    { value: 'REJECTED', label: tStatus('REJECTED') },
  ];

  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>('PENDING');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStatus, setDraftStatus] = useState<string>('PENDING');
  const [selected, setSelected] = useState<AuditRecordDTO | null>(null);
  const [comment, setComment] = useState('');

  const params: AuditQuery = {
    page,
    pageSize: PAGE_SIZE,
    status: status ? (status as ProductAuditStatus) : undefined,
    keyword: keyword || undefined,
  };

  const auditsQuery = useQuery({
    queryKey: ['ops', 'audits', params],
    queryFn: () => apiFetchWithMeta<AuditRecordDTO[]>('/api/bff/audits', { query: params }),
  });

  const productId = selected?.product.id ?? null;

  const detailQuery = useQuery({
    queryKey: ['ops', 'products', 'detail', productId],
    queryFn: () => apiFetch<ProductDetailDTO>(`/api/bff/products/${productId}`),
    enabled: productId !== null,
  });

  const categoryTreeQuery = useQuery({
    queryKey: ['ops', 'categories', 'tree'],
    queryFn: () => apiFetch<CategoryNodeDTO[]>('/api/bff/categories/tree'),
    enabled: productId !== null,
  });

  const attributeNames = useMemo(() => {
    const names: Record<string, string> = {};
    const nodes = Array.isArray(categoryTreeQuery.data) ? categoryTreeQuery.data : [];

    for (const node of nodes) {
      for (const attribute of node.attributes ?? []) {
        names[attribute.id] = attribute.name;
      }
    }

    return names;
  }, [categoryTreeQuery.data]);

  const submittedVersion = useMemo(() => {
    const detail = detailQuery.data;

    if (!detail || typeof detail !== 'object') {
      return null;
    }

    const candidates = [detail.currentVersion, detail.publishedVersion];

    return candidates.find(candidate => candidate?.id === selected?.productVersionId) ?? null;
  }, [detailQuery.data, selected?.productVersionId]);

  const closeDialog = () => {
    setSelected(null);
    setComment('');
  };

  const onRequestError = (error: unknown) => {
    toast.error(translateApiError(error, tRoot, 'common.actionFailed'));
  };

  const invalidateAudits = () => queryClient.invalidateQueries({ queryKey: ['ops', 'audits'] });

  const onMutationError = async (error: unknown) => {
    onRequestError(error);
    await invalidateAudits();
  };

  const approveMutation = useMutation({
    mutationFn: ({ audit, note }: { audit: AuditRecordDTO; note: string }) =>
      apiFetch<AuditRecordDTO>(`/api/bff/audits/${audit.id}/approve`, {
        method: 'POST',
        body: { comment: note.trim() || undefined },
      }),
    onSuccess: async () => {
      toast.success(t('toast.approved'));
      closeDialog();
      await invalidateAudits();
    },
    onError: onMutationError,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ audit, note }: { audit: AuditRecordDTO; note: string }) =>
      apiFetch<AuditRecordDTO>(`/api/bff/audits/${audit.id}/reject`, {
        method: 'POST',
        body: { comment: note },
      }),
    onSuccess: async () => {
      toast.success(t('toast.rejected'));
      closeDialog();
      await invalidateAudits();
    },
    onError: onMutationError,
  });

  const applyFilters = () => {
    setKeyword(draftKeyword.trim());
    setStatus(draftStatus);
    setPage(1);
  };

  const resetFilters = () => {
    setDraftKeyword('');
    setDraftStatus('PENDING');
    setKeyword('');
    setStatus('PENDING');
    setPage(1);
  };

  const handleApprove = () => {
    if (!selected) {
      return;
    }

    approveMutation.mutate({ audit: selected, note: comment });
  };

  const handleReject = () => {
    if (!selected) {
      return;
    }

    const note = comment.trim();

    if (!note) {
      toast.error(t('commentRequired'));
      return;
    }

    rejectMutation.mutate({ audit: selected, note });
  };

  const audits = auditsQuery.data?.data ?? [];
  const total = auditsQuery.data?.meta?.total ?? audits.length;
  const isPendingDecision = approveMutation.isPending || rejectMutation.isPending;

  const columns: DataTableColumns<AuditRecordDTO> = [
    {
      key: 'product',
      title: t('columns.product'),
      render: (_, row) => (
        <div className={styles.product}>
          <img className={styles.thumbnail} src={row.product.mainImageUrl} alt={row.product.title} />
          <span className={styles.title}>{row.product.title}</span>
        </div>
      ),
    },
    {
      key: 'code',
      title: t('columns.code'),
      render: (_, row) => row.product.code,
    },
    {
      key: 'merchantName',
      title: t('columns.merchant'),
      render: (_, row) => row.product.merchantName,
    },
    {
      key: 'shopName',
      title: t('columns.shop'),
      render: (_, row) => row.product.shopName,
    },
    {
      key: 'categoryName',
      title: t('columns.category'),
      render: (_, row) => row.product.categoryName,
    },
    {
      key: 'version',
      title: t('columns.version'),
      width: 80,
      render: (_, row) => `V${row.product.version}`,
    },
    {
      key: 'submittedAt',
      title: t('columns.submittedAt'),
      render: (_, row) => formatDateTime(row.submittedAt),
    },
    {
      key: 'status',
      title: t('columns.status'),
      width: 100,
      render: (_, row) => <StatusTag status={row.status} />,
    },
    {
      key: 'actions',
      title: t('columns.actions'),
      width: 100,
      render: (_, row) => (
        <div className={styles.actions}>
          <Button variant='ghost' size='sm' data-testid='audit-open' onClick={() => setSelected(row)}>
            {row.status === 'PENDING' ? t('actionReview') : t('actionView')}
          </Button>
        </div>
      ),
    },
  ];

  const canReview = selected?.status === 'PENDING';

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

      {auditsQuery.isError ? (
        <Empty description={tCommon('loadFailed')} />
      ) : (
        <DataTable
          columns={columns}
          data={audits}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          rowKey='id'
          loading={auditsQuery.isPending}
          emptyText={t('empty')}
        />
      )}

      <Dialog
        open={selected !== null}
        onOpenChange={open => {
          if (isPendingDecision) {
            return;
          }

          if (!open) closeDialog();
        }}
        title={t('dialog.title')}
        description={selected ? t('dialog.description', { name: selected.product.title }) : undefined}
        className={styles.wideDialog}
        footer={
          canReview ? (
            <div className={styles.footer}>
              <Button variant='secondary' onClick={closeDialog} disabled={isPendingDecision}>
                {t('buttons.cancel')}
              </Button>
              <Button
                variant='danger'
                loading={rejectMutation.isPending}
                disabled={isPendingDecision}
                onClick={handleReject}
                data-testid='audit-reject'
              >
                {t('buttons.reject')}
              </Button>
              <Button
                loading={approveMutation.isPending}
                disabled={isPendingDecision}
                onClick={handleApprove}
                data-testid='audit-approve'
              >
                {t('buttons.approve')}
              </Button>
            </div>
          ) : undefined
        }
      >
        {selected ? (
          <div className={styles.detail}>
            <div className={styles.infoGrid}>
              <LabelValue label={t('info.productCode')}>{selected.product.code}</LabelValue>
              <LabelValue label={t('info.merchant')}>{selected.product.merchantName}</LabelValue>
              <LabelValue label={t('info.shop')}>{selected.product.shopName}</LabelValue>
              <LabelValue label={t('info.category')}>{selected.product.categoryName}</LabelValue>
              <LabelValue label={t('info.submittedVersion')}>V{selected.product.version}</LabelValue>
              <LabelValue label={t('info.submittedAt')}>{formatDateTime(selected.submittedAt)}</LabelValue>
              <LabelValue label={t('info.status')}>
                <span data-testid='audit-status'>
                  <StatusTag status={selected.status} />
                </span>
              </LabelValue>
              {selected.reviewedAt ? (
                <LabelValue label={t('info.reviewedAt')}>{formatDateTime(selected.reviewedAt)}</LabelValue>
              ) : null}
              {!canReview ? <LabelValue label={t('info.comment')}>{selected.comment || '-'}</LabelValue> : null}
            </div>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('section.submittedVersion')}</h3>
              {detailQuery.isPending ? <Skeleton rows={4} /> : null}
              {!detailQuery.isPending && submittedVersion ? (
                <VersionContent version={submittedVersion} attributeNames={attributeNames} />
              ) : null}
              {!detailQuery.isPending && !submittedVersion ? (
                <p className={styles.muted}>{t('snapshotUnavailable')}</p>
              ) : null}
            </section>

            {canReview ? (
              <Field label={t('fields.comment')} hint={t('fields.commentHint')}>
                <Textarea
                  aria-label={t('fields.comment')}
                  data-testid='audit-comment'
                  rows={3}
                  maxLength={500}
                  value={comment}
                  onChange={event => setComment(event.target.value)}
                />
              </Field>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </PageContainer>
  );
}

export default AuditManager;
