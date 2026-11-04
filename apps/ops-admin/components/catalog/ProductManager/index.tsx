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
import { useMemo, useState } from 'react';

import { apiFetch, apiFetchWithMeta } from '@/lib/api-client';

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
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'SUBMITTED', label: '审核中' },
  { value: 'APPROVED', label: '已通过' },
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
  const entries = Object.entries(specs);

  return entries.length ? entries.map(([key, value]) => `${key}：${value}`).join(' / ') : '-';
}

function StatusTag({ status }: { status: ProductVersionStatus }) {
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

const VERSION_COLUMNS: DataTableColumns<ProductVersionSummaryDTO> = [
  {
    key: 'version',
    title: '版本',
    width: 80,
    render: (_, version) => `V${version.version}`,
  },
  {
    key: 'status',
    title: '状态',
    width: 100,
    render: (_, version) => <StatusTag status={version.status} />,
  },
  {
    dataIndex: 'title',
    title: '标题',
  },
  {
    key: 'createdAt',
    title: '创建时间',
    render: (_, version) => formatDateTime(version.createdAt),
  },
  {
    key: 'submittedAt',
    title: '提交时间',
    render: (_, version) => formatDateTime(version.submittedAt),
  },
  {
    key: 'reviewedAt',
    title: '审核时间',
    render: (_, version) => formatDateTime(version.reviewedAt),
  },
  {
    key: 'publishedAt',
    title: '发布时间',
    render: (_, version) => formatDateTime(version.publishedAt),
  },
];

function VersionContent({
  version,
  attributeNames,
}: {
  version: ProductVersionDTO;
  attributeNames: Record<string, string>;
}) {
  const attributeEntries = Object.entries(version.attributes);

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
        data={version.skus}
        total={version.skus.length}
        page={1}
        pageSize={Math.max(version.skus.length, 10)}
        onPageChange={() => {}}
        rowKey='id'
        emptyText='暂无 SKU'
      />
    </div>
  );
}

function ProductDetailDialog({ productId, onClose }: { productId: string | null; onClose: () => void }) {
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

  const product = detailQuery.data;

  return (
    <Dialog
      open={productId !== null}
      onOpenChange={open => {
        if (!open) onClose();
      }}
      title='商品详情'
      description={product ? `商品：${product.title}` : undefined}
      className={styles.wideDialog}
    >
      {detailQuery.isPending ? <Skeleton rows={4} /> : null}

      {detailQuery.isError ? <Empty description='加载失败' /> : null}

      {product ? (
        <div className={styles.detail}>
          <div className={styles.infoGrid}>
            <LabelValue label='商品编码'>{product.code}</LabelValue>
            <LabelValue label='商家'>{product.merchantName}</LabelValue>
            <LabelValue label='店铺'>{product.shopName}</LabelValue>
            <LabelValue label='类目'>{product.categoryName}</LabelValue>
            <LabelValue label='品牌'>{product.brandName ?? '-'}</LabelValue>
            <LabelValue label='状态'>
              <StatusTag status={product.status} />
            </LabelValue>
            <LabelValue label='当前版本'>V{product.version}</LabelValue>
            <LabelValue label='更新时间'>{formatDateTime(product.updatedAt)}</LabelValue>
          </div>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>当前版本</h3>
            <VersionContent version={product.currentVersion} attributeNames={attributeNames} />
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>线上版本</h3>
            {product.publishedVersion ? (
              <VersionContent version={product.publishedVersion} attributeNames={attributeNames} />
            ) : (
              <p className={styles.muted}>暂无线上版本</p>
            )}
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>版本历史</h3>
            <DataTable
              columns={VERSION_COLUMNS}
              data={product.versions}
              total={product.versions.length}
              page={1}
              pageSize={Math.max(product.versions.length, 10)}
              onPageChange={() => {}}
              rowKey='id'
              emptyText='暂无版本记录'
            />
          </section>
        </div>
      ) : null}
    </Dialog>
  );
}

export function ProductManager() {
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
      dataIndex: 'merchantName',
      title: '商家',
    },
    {
      dataIndex: 'shopName',
      title: '店铺',
    },
    {
      dataIndex: 'categoryName',
      title: '类目',
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (_, row) => <StatusTag status={row.status} />,
    },
    {
      dataIndex: 'version',
      title: '版本',
      width: 80,
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
    <PageContainer title='商品管理' description='查看商品资料、版本与 SKU 信息（只读）。'>
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
              onChange={value => setDraftStatus(String(value))}
            />
          </Field>
        </SearchForm>
      </div>

      {productsQuery.isError ? (
        <Empty description='加载失败' />
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
          emptyText='暂无商品'
        />
      )}

      <ProductDetailDialog productId={detailId} onClose={() => setDetailId(null)} />
    </PageContainer>
  );
}

export default ProductManager;
