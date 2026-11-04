'use client';

import type {
  CategoryNodeDTO,
  ProductDetailDTO,
  ProductListRowDTO,
  ProductVersionDTO,
  ProductVersionStatus,
  ProductVersionSummaryDTO,
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
} from '@mtm/ui';
import type { DataTableColumns, TagTone } from '@mtm/ui';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { apiFetch, apiFetchWithMeta } from '@/lib/api-client';

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

function formatSpecs(specs: Record<string, string>, separator: string): string {
  const entries = Object.entries(specs);

  return entries.length ? entries.map(([key, value]) => `${key}${separator}${value}`).join(' / ') : '-';
}

function StatusTag({ status }: { status: ProductVersionStatus }) {
  const t = useTranslations('catalog.products.status');
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
  const t = useTranslations('catalog.products');
  const tStatus = useTranslations('opsCommon.status');
  const attributeEntries = Object.entries(version.attributes);

  const skuColumns: DataTableColumns<SkuDTO> = [
    {
      dataIndex: 'skuCode',
      title: t('skuColumns.code'),
    },
    {
      key: 'specs',
      title: t('skuColumns.specs'),
      render: (_, sku) => formatSpecs(sku.specs, t('specSeparator')),
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
      <p className={styles.versionTitle}>
        <span className={styles.versionName}>{version.title}</span>
        <StatusTag status={version.status} />
        <span className={styles.muted}>V{version.version}</span>
      </p>
      {version.subtitle ? <p className={styles.versionSubtitle}>{version.subtitle}</p> : null}

      <div className={styles.images}>
        {version.images.map(url => (
          <img key={url} className={styles.image} src={url} alt={version.title} />
        ))}
      </div>

      <p className={styles.description}>{version.description}</p>

      <h4 className={styles.subTitle}>{t('detail.attributes')}</h4>
      {attributeEntries.length ? (
        <div className={styles.attributes}>
          {attributeEntries.map(([key, value]) => (
            <LabelValue key={key} label={attributeNames[key] ?? key}>
              {value || '-'}
            </LabelValue>
          ))}
        </div>
      ) : (
        <p className={styles.muted}>{t('detail.noAttributes')}</p>
      )}

      <h4 className={styles.subTitle}>{t('detail.sku')}</h4>
      <DataTable
        columns={skuColumns}
        data={version.skus}
        total={version.skus.length}
        page={1}
        pageSize={Math.max(version.skus.length, 10)}
        onPageChange={() => {}}
        rowKey='id'
        emptyText={t('detail.noSku')}
      />
    </div>
  );
}

function ProductDetailDialog({ productId, onClose }: { productId: string | null; onClose: () => void }) {
  const t = useTranslations('catalog.products');
  const tCommon = useTranslations('common');
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

    for (const node of categoryTreeQuery.data ?? []) {
      for (const attribute of node.attributes) {
        names[attribute.id] = attribute.name;
      }
    }

    return names;
  }, [categoryTreeQuery.data]);

  const versionColumns: DataTableColumns<ProductVersionSummaryDTO> = [
    {
      key: 'version',
      title: t('versionColumns.version'),
      width: 80,
      render: (_, version) => `V${version.version}`,
    },
    {
      key: 'status',
      title: t('versionColumns.status'),
      width: 100,
      render: (_, version) => <StatusTag status={version.status} />,
    },
    {
      dataIndex: 'title',
      title: t('versionColumns.title'),
    },
    {
      key: 'createdAt',
      title: t('versionColumns.createdAt'),
      render: (_, version) => formatDateTime(version.createdAt),
    },
    {
      key: 'submittedAt',
      title: t('versionColumns.submittedAt'),
      render: (_, version) => formatDateTime(version.submittedAt),
    },
    {
      key: 'reviewedAt',
      title: t('versionColumns.reviewedAt'),
      render: (_, version) => formatDateTime(version.reviewedAt),
    },
    {
      key: 'publishedAt',
      title: t('versionColumns.publishedAt'),
      render: (_, version) => formatDateTime(version.publishedAt),
    },
  ];

  const product = detailQuery.data;

  return (
    <Dialog
      open={productId !== null}
      onOpenChange={open => {
        if (!open) onClose();
      }}
      title={t('detail.title')}
      description={product ? t('detail.description', { name: product.title }) : undefined}
      className={styles.wideDialog}
    >
      {detailQuery.isPending ? <Skeleton rows={4} /> : null}

      {detailQuery.isError ? <Empty description={tCommon('loadFailed')} /> : null}

      {product ? (
        <div className={styles.detail}>
          <div className={styles.infoGrid}>
            <LabelValue label={t('fields.code')}>{product.code}</LabelValue>
            <LabelValue label={t('fields.merchant')}>{product.merchantName}</LabelValue>
            <LabelValue label={t('fields.shop')}>{product.shopName}</LabelValue>
            <LabelValue label={t('fields.category')}>{product.categoryName}</LabelValue>
            <LabelValue label={t('fields.brand')}>{product.brandName ?? '-'}</LabelValue>
            <LabelValue label={t('fields.status')}>
              <StatusTag status={product.status} />
            </LabelValue>
            <LabelValue label={t('fields.currentVersion')}>V{product.version}</LabelValue>
            <LabelValue label={t('fields.updatedAt')}>{formatDateTime(product.updatedAt)}</LabelValue>
          </div>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('detail.currentVersion')}</h3>
            <VersionContent version={product.currentVersion} attributeNames={attributeNames} />
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('detail.onlineVersion')}</h3>
            {product.publishedVersion ? (
              <VersionContent version={product.publishedVersion} attributeNames={attributeNames} />
            ) : (
              <p className={styles.muted}>{t('detail.noOnlineVersion')}</p>
            )}
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('detail.versionHistory')}</h3>
            <DataTable
              columns={versionColumns}
              data={product.versions}
              total={product.versions.length}
              page={1}
              pageSize={Math.max(product.versions.length, 10)}
              onPageChange={() => {}}
              rowKey='id'
              emptyText={t('detail.noVersions')}
            />
          </section>
        </div>
      ) : null}
    </Dialog>
  );
}

export function ProductManager() {
  const t = useTranslations('catalog.products');
  const tCommon = useTranslations('common');
  const tOps = useTranslations('opsCommon');
  const tStatus = useTranslations('catalog.products.status');

  const statusFilterOptions = [
    { value: '', label: tOps('all') },
    { value: 'PUBLISHED', label: tStatus('PUBLISHED') },
    { value: 'SUBMITTED', label: tStatus('SUBMITTED') },
    { value: 'APPROVED', label: tStatus('APPROVED') },
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

  const productsQuery = useQuery({
    queryKey: ['ops', 'products', 'list', params],
    queryFn: () => apiFetchWithMeta<ProductListRowDTO[]>('/api/bff/products', { query: params }),
  });

  const applyFilters = () => {
    setKeyword(draftKeyword.trim());
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

  const products = productsQuery.data?.data ?? [];
  const total = productsQuery.data?.meta?.total ?? products.length;

  const columns: DataTableColumns<ProductListRowDTO> = [
    {
      key: 'product',
      title: t('columns.product'),
      render: (_, row) => (
        <div className={styles.product}>
          <img className={styles.thumbnail} src={row.mainImageUrl} alt={row.title} />
          <span className={styles.title}>{row.title}</span>
        </div>
      ),
    },
    {
      dataIndex: 'code',
      title: t('columns.code'),
    },
    {
      dataIndex: 'merchantName',
      title: t('columns.merchant'),
    },
    {
      dataIndex: 'shopName',
      title: t('columns.shop'),
    },
    {
      dataIndex: 'categoryName',
      title: t('columns.category'),
    },
    {
      key: 'status',
      title: t('columns.status'),
      width: 100,
      render: (_, row) => <StatusTag status={row.status} />,
    },
    {
      dataIndex: 'version',
      title: t('columns.version'),
      width: 80,
      render: (value: number) => `V${value}`,
    },
    {
      dataIndex: 'updatedAt',
      title: t('columns.updatedAt'),
      render: (value: string) => formatDateTime(value),
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

      {productsQuery.isError ? (
        <Empty description={tCommon('loadFailed')} />
      ) : (
        <DataTable
          columns={columns}
          data={products}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          rowKey='id'
          loading={productsQuery.isPending}
          emptyText={t('empty')}
        />
      )}

      <ProductDetailDialog productId={detailId} onClose={() => setDetailId(null)} />
    </PageContainer>
  );
}

export default ProductManager;
