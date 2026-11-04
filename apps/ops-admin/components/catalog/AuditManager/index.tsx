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
import { useMemo, useState } from 'react';

import { ApiError, apiFetch, apiFetchWithMeta } from '@/lib/api-client';

import styles from './index.module.css';

const PAGE_SIZE = 10;

const STATUS_META: Record<ProductAuditStatus, { label: string; tone: TagTone }> = {
  PENDING: { label: '待审核', tone: 'warning' },
  APPROVED: { label: '已通过', tone: 'success' },
  REJECTED: { label: '已驳回', tone: 'danger' },
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'PENDING', label: '待审核' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已驳回' },
];

const SKU_STATUS_LABELS: Record<SkuDTO['status'], string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
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

function formatSpecs(specs: Record<string, string>): string {
  const entries = Object.entries(specs ?? {});

  return entries.length ? entries.map(([key, value]) => `${key}：${value}`).join(' / ') : '-';
}

function StatusTag({ status }: { status: ProductAuditStatus }) {
  const meta = STATUS_META[status];

  return meta ? <Tag tone={meta.tone}>{meta.label}</Tag> : <span className={styles.muted}>--</span>;
}

const SKU_COLUMNS: DataTableColumns<SkuDTO> = [
  {
    dataIndex: 'skuCode',
    title: 'SKU 编码',
  },
  {
    key: 'specs',
    title: '规格',
    render: (_, sku) => formatSpecs(sku.specs),
  },
  {
    dataIndex: 'price',
    title: '价格',
    width: 120,
  },
  {
    dataIndex: 'stock',
    title: '库存',
    width: 100,
  },
  {
    key: 'status',
    title: '状态',
    width: 100,
    render: (_, sku) => (
      <Tag tone={sku.status === 'ACTIVE' ? 'success' : 'neutral'}>{SKU_STATUS_LABELS[sku.status]}</Tag>
    ),
  },
];

function VersionContent({
  version,
  attributeNames,
}: {
  version: ProductVersionDTO;
  attributeNames: Record<string, string>;
}) {
  const attributeEntries = Object.entries(version.attributes ?? {});

  return (
    <div className={styles.version}>
      <div className={styles.mainImage}>
        <img className={styles.image} src={version.mainImageUrl} alt={version.title} />
      </div>

      <p className={styles.description}>{version.description || '暂无描述'}</p>

      <h4 className={styles.subTitle}>属性</h4>
      {attributeEntries.length ? (
        <div className={styles.attributes}>
          {attributeEntries.map(([key, value]) => (
            <LabelValue key={key} label={attributeNames[key] ?? key}>
              {value || '-'}
            </LabelValue>
          ))}
        </div>
      ) : (
        <p className={styles.muted}>暂无属性</p>
      )}

      <h4 className={styles.subTitle}>SKU</h4>
      <DataTable
        columns={SKU_COLUMNS}
        data={version.skus ?? []}
        total={version.skus?.length ?? 0}
        page={1}
        pageSize={Math.max(version.skus?.length ?? 0, 10)}
        onPageChange={() => {}}
        rowKey='id'
        emptyText='暂无 SKU'
      />
    </div>
  );
}

export function AuditManager() {
  const toast = useToast();
  const queryClient = useQueryClient();

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
    toast.error(error instanceof ApiError ? error.message : '操作失败，请稍后重试');
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
      toast.success('审核已通过');
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
      toast.success('商品已驳回');
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
      toast.error('请填写驳回原因');
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
      title: '商品',
      render: (_, row) => (
        <div className={styles.product}>
          <img className={styles.thumbnail} src={row.product.mainImageUrl} alt={row.product.title} />
          <span className={styles.title}>{row.product.title}</span>
        </div>
      ),
    },
    {
      key: 'code',
      title: '编码',
      render: (_, row) => row.product.code,
    },
    {
      key: 'merchantName',
      title: '商家',
      render: (_, row) => row.product.merchantName,
    },
    {
      key: 'shopName',
      title: '店铺',
      render: (_, row) => row.product.shopName,
    },
    {
      key: 'categoryName',
      title: '类目',
      render: (_, row) => row.product.categoryName,
    },
    {
      key: 'version',
      title: '版本',
      width: 80,
      render: (_, row) => `V${row.product.version}`,
    },
    {
      key: 'submittedAt',
      title: '提交时间',
      render: (_, row) => formatDateTime(row.submittedAt),
    },
    {
      key: 'status',
      title: '审核状态',
      width: 100,
      render: (_, row) => <StatusTag status={row.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      width: 100,
      render: (_, row) => (
        <div className={styles.actions}>
          <Button variant='ghost' size='sm' onClick={() => setSelected(row)}>
            {row.status === 'PENDING' ? '审核' : '查看'}
          </Button>
        </div>
      ),
    },
  ];

  const canReview = selected?.status === 'PENDING';

  return (
    <PageContainer title='商品审核' description='审核商家提交的商品版本，通过或驳回并记录意见。'>
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
          <Field label='审核状态'>
            <Select
              aria-label='审核状态筛选'
              options={STATUS_FILTER_OPTIONS}
              value={draftStatus}
              onChange={value => setDraftStatus(String(value))}
            />
          </Field>
        </SearchForm>
      </div>

      {auditsQuery.isError ? (
        <Empty description='加载失败' />
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
          emptyText='暂无审核记录'
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
        title='审核详情'
        description={selected ? `商品：${selected.product.title}` : undefined}
        className={styles.wideDialog}
        footer={
          canReview ? (
            <div className={styles.footer}>
              <Button variant='secondary' onClick={closeDialog} disabled={isPendingDecision}>
                取消
              </Button>
              <Button
                variant='danger'
                loading={rejectMutation.isPending}
                disabled={isPendingDecision}
                onClick={handleReject}
              >
                驳回
              </Button>
              <Button loading={approveMutation.isPending} disabled={isPendingDecision} onClick={handleApprove}>
                通过
              </Button>
            </div>
          ) : undefined
        }
      >
        {selected ? (
          <div className={styles.detail}>
            <div className={styles.infoGrid}>
              <LabelValue label='商品编码'>{selected.product.code}</LabelValue>
              <LabelValue label='商家'>{selected.product.merchantName}</LabelValue>
              <LabelValue label='店铺'>{selected.product.shopName}</LabelValue>
              <LabelValue label='类目'>{selected.product.categoryName}</LabelValue>
              <LabelValue label='提交版本'>V{selected.product.version}</LabelValue>
              <LabelValue label='提交时间'>{formatDateTime(selected.submittedAt)}</LabelValue>
              <LabelValue label='审核状态'>
                <StatusTag status={selected.status} />
              </LabelValue>
              {selected.reviewedAt ? (
                <LabelValue label='审核时间'>{formatDateTime(selected.reviewedAt)}</LabelValue>
              ) : null}
              {!canReview ? <LabelValue label='审核意见'>{selected.comment || '-'}</LabelValue> : null}
            </div>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>提交版本内容</h3>
              {detailQuery.isPending ? <Skeleton rows={4} /> : null}
              {!detailQuery.isPending && submittedVersion ? (
                <VersionContent version={submittedVersion} attributeNames={attributeNames} />
              ) : null}
              {!detailQuery.isPending && !submittedVersion ? (
                <p className={styles.muted}>该审核版本的快照不可用</p>
              ) : null}
            </section>

            {canReview ? (
              <Field label='审核备注' hint='通过时可选，驳回时必填（最多 500 字）'>
                <Textarea
                  aria-label='审核备注'
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
