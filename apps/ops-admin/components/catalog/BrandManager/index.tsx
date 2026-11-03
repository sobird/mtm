'use client';

import { PERMISSIONS } from '@mtm/contracts';
import type { BrandDTO } from '@mtm/contracts';
import {
  Button,
  Can,
  DataTable,
  Dialog,
  Empty,
  Field,
  Form,
  Input,
  PageContainer,
  SearchForm,
  Select,
  Tag,
  useToast,
} from '@mtm/ui';
import type { DataTableColumns } from '@mtm/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { z } from 'zod';

import { ApiError, apiFetch, apiFetchWithMeta } from '@/lib/api-client';

import { BrandLogoField } from '../BrandLogoField';

import styles from './index.module.css';

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<BrandDTO['status'], string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'ACTIVE', label: '启用' },
  { value: 'DISABLED', label: '停用' },
];

const STATUS_FORM_OPTIONS = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'DISABLED', label: '停用' },
];

const brandSchema = z.object({
  name: z.string().trim().min(1).max(50),
  status: z.enum(['ACTIVE', 'DISABLED']),
  logoUrl: z.string().nullable(),
});

type BrandFormValues = z.output<typeof brandSchema>;

type DialogState = { type: 'create' } | { type: 'edit'; brand: BrandDTO } | null;

function normalizeLogoUrl(logoUrl: string | null): string | null {
  return logoUrl && logoUrl.trim() ? logoUrl : null;
}

export function BrandManager() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStatus, setDraftStatus] = useState('');
  const [dialog, setDialog] = useState<DialogState>(null);

  const params = {
    page,
    pageSize: PAGE_SIZE,
    keyword: keyword || undefined,
    status: status || undefined,
  };

  const brandsQuery = useQuery({
    queryKey: ['ops', 'brands', params],
    queryFn: () => apiFetchWithMeta<BrandDTO[]>('/api/bff/brands', { query: params }),
  });

  const onRequestError = (error: unknown) => {
    toast.error(error instanceof ApiError ? error.message : '操作失败，请稍后重试');
  };

  const invalidateBrands = () => queryClient.invalidateQueries({ queryKey: ['ops', 'brands'] });

  const createMutation = useMutation({
    mutationFn: (values: BrandFormValues) =>
      apiFetch<BrandDTO>('/api/bff/brands', {
        method: 'POST',
        body: {
          name: values.name,
          status: values.status,
          logoUrl: normalizeLogoUrl(values.logoUrl),
        },
      }),
    onSuccess: async () => {
      toast.success('品牌已创建');
      setDialog(null);
      await invalidateBrands();
    },
    onError: onRequestError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: BrandFormValues }) =>
      apiFetch<BrandDTO>(`/api/bff/brands/${id}`, {
        method: 'PATCH',
        body: {
          name: values.name,
          status: values.status,
          logoUrl: normalizeLogoUrl(values.logoUrl),
        },
      }),
    onSuccess: async () => {
      toast.success('品牌已更新');
      setDialog(null);
      await invalidateBrands();
    },
    onError: onRequestError,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: BrandDTO['status'] }) =>
      apiFetch<BrandDTO>(`/api/bff/brands/${id}`, {
        method: 'PATCH',
        body: { status: nextStatus },
      }),
    onSuccess: async () => {
      toast.success('品牌状态已更新');
      await invalidateBrands();
    },
    onError: onRequestError,
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

  const closeDialog = () => setDialog(null);

  const brands = brandsQuery.data?.data ?? [];
  const total = brandsQuery.data?.meta?.total ?? brands.length;

  const columns: DataTableColumns<BrandDTO> = [
    {
      key: 'logoUrl',
      title: 'Logo',
      width: 90,
      render: (_, row) =>
        row.logoUrl ? (
          <img className={styles.logo} src={row.logoUrl} alt={row.name} />
        ) : (
          <span className={styles.logoPlaceholder}>无</span>
        ),
    },
    {
      dataIndex: 'name',
      title: '品牌名称',
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
      width: 160,
      render: (_, row) => (
        <Can permission={PERMISSIONS.BRAND_MANAGE}>
          <div className={styles.actions}>
            <Button variant='ghost' size='sm' onClick={() => setDialog({ type: 'edit', brand: row })}>
              编辑
            </Button>
            <Button
              variant='ghost'
              size='sm'
              loading={toggleMutation.isPending && toggleMutation.variables?.id === row.id}
              onClick={() =>
                toggleMutation.mutate({
                  id: row.id,
                  nextStatus: row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                })
              }
            >
              {row.status === 'ACTIVE' ? '停用' : '启用'}
            </Button>
          </div>
        </Can>
      ),
    },
  ];

  const renderDialog = () => {
    if (!dialog) {
      return null;
    }

    if (dialog.type === 'edit') {
      return (
        <Dialog
          open
          onOpenChange={open => {
            if (!open) closeDialog();
          }}
          title='编辑品牌'
          description={`品牌：${dialog.brand.name}`}
        >
          <Form
            schema={brandSchema}
            defaultValues={{
              name: dialog.brand.name,
              status: dialog.brand.status,
              logoUrl: dialog.brand.logoUrl,
            }}
            onSubmit={values => updateMutation.mutate({ id: dialog.brand.id, values })}
          >
            <Field label='品牌名称' required>
              <Input name='name' aria-label='品牌名称' placeholder='请输入品牌名称' />
            </Field>
            <Field label='状态' required>
              <Select name='status' aria-label='品牌状态' options={STATUS_FORM_OPTIONS} />
            </Field>
            <Field label='Logo' hint='支持 PNG、JPEG、WebP，最大 10MB'>
              <BrandLogoField />
            </Field>
            <div className={styles.formActions}>
              <Button type='button' variant='secondary' onClick={closeDialog}>
                取消
              </Button>
              <Button type='submit' loading={updateMutation.isPending}>
                保存
              </Button>
            </div>
          </Form>
        </Dialog>
      );
    }

    return (
      <Dialog
        open
        onOpenChange={open => {
          if (!open) closeDialog();
        }}
        title='新建品牌'
        description='创建后可在列表中编辑或启用停用。'
      >
        <Form
          schema={brandSchema}
          defaultValues={{ name: '', status: 'ACTIVE', logoUrl: null }}
          onSubmit={values => createMutation.mutate(values)}
        >
          <Field label='品牌名称' required>
            <Input name='name' aria-label='品牌名称' placeholder='请输入品牌名称' />
          </Field>
          <Field label='状态' required>
            <Select name='status' aria-label='品牌状态' options={STATUS_FORM_OPTIONS} />
          </Field>
          <Field label='Logo' hint='支持 PNG、JPEG、WebP，最大 10MB'>
            <BrandLogoField />
          </Field>
          <div className={styles.formActions}>
            <Button type='button' variant='secondary' onClick={closeDialog}>
              取消
            </Button>
            <Button type='submit' loading={createMutation.isPending}>
              保存
            </Button>
          </div>
        </Form>
      </Dialog>
    );
  };

  return (
    <PageContainer
      title='品牌管理'
      description='维护品牌名称、Logo 与启用状态。'
      actions={
        <Can permission={PERMISSIONS.BRAND_MANAGE}>
          <Button onClick={() => setDialog({ type: 'create' })}>新建品牌</Button>
        </Can>
      }
    >
      <div className={styles.toolbar}>
        <SearchForm onSubmit={applyFilters} onReset={resetFilters}>
          <Field label='关键字'>
            <Input
              aria-label='关键字'
              placeholder='品牌名称'
              value={draftKeyword}
              onChange={event => setDraftKeyword(event.target.value)}
            />
          </Field>
          <Field label='状态'>
            <Select
              aria-label='品牌状态筛选'
              options={STATUS_FILTER_OPTIONS}
              value={draftStatus}
              onChange={value => setDraftStatus(String(value))}
            />
          </Field>
        </SearchForm>
      </div>

      {brandsQuery.isError ? (
        <Empty description='加载失败' />
      ) : (
        <DataTable
          columns={columns}
          data={brands}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          rowKey='id'
          loading={brandsQuery.isPending}
          emptyText='暂无品牌'
        />
      )}

      {renderDialog()}
    </PageContainer>
  );
}

export default BrandManager;
