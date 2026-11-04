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
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { z } from 'zod';

import { apiFetch, apiFetchWithMeta } from '@/lib/api-client';
import { translateApiError } from '@/lib/translate-api-error';

import { BrandLogoField } from '../BrandLogoField';

import styles from './index.module.css';

const PAGE_SIZE = 10;

type DialogState = { type: 'create' } | { type: 'edit'; brand: BrandDTO } | null;

function normalizeLogoUrl(logoUrl: string | null): string | null {
  return logoUrl && logoUrl.trim() ? logoUrl : null;
}

export function BrandManager() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('catalog.brands');
  const tCommon = useTranslations('common');
  const tOps = useTranslations('opsCommon');
  const tStatus = useTranslations('opsCommon.status');
  const tRoot = useTranslations();

  const brandSchema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, tRoot('validation.brandNameRequired')).max(50, tRoot('validation.brandNameMax')),
        status: z.enum(['ACTIVE', 'DISABLED']),
        logoUrl: z.string().nullable(),
      }),
    [tRoot]
  );

  type BrandFormValues = z.output<typeof brandSchema>;

  const statusFilterOptions = [
    { value: '', label: tOps('all') },
    { value: 'ACTIVE', label: tStatus('active') },
    { value: 'DISABLED', label: tStatus('disabled') },
  ];

  const statusFormOptions = [
    { value: 'ACTIVE', label: tStatus('active') },
    { value: 'DISABLED', label: tStatus('disabled') },
  ];

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
    toast.error(translateApiError(error, tRoot, 'common.actionFailed'));
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
      toast.success(t('toast.created'));
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
      toast.success(t('toast.updated'));
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
      toast.success(t('toast.statusUpdated'));
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
      title: t('columns.logo'),
      width: 90,
      render: (_, row) =>
        row.logoUrl ? (
          <img className={styles.logo} src={row.logoUrl} alt={row.name} />
        ) : (
          <span className={styles.logoPlaceholder}>{t('logoNone')}</span>
        ),
    },
    {
      dataIndex: 'name',
      title: t('columns.name'),
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
      width: 160,
      render: (_, row) => (
        <Can permission={PERMISSIONS.BRAND_MANAGE}>
          <div className={styles.actions}>
            <Button variant='ghost' size='sm' onClick={() => setDialog({ type: 'edit', brand: row })}>
              {tCommon('edit')}
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
              {row.status === 'ACTIVE' ? tOps('disable') : tOps('enable')}
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
          title={t('dialog.editTitle')}
          description={t('dialog.editDescription', { name: dialog.brand.name })}
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
            <Field label={t('fields.name')} required>
              <Input name='name' aria-label={t('fields.name')} placeholder={t('fields.namePlaceholder')} />
            </Field>
            <Field label={t('fields.status')} required>
              <Select name='status' aria-label={t('fields.statusFilter')} options={statusFormOptions} />
            </Field>
            <Field label={t('fields.logo')} hint={t('fields.logoHint')}>
              <BrandLogoField />
            </Field>
            <div className={styles.formActions}>
              <Button type='button' variant='secondary' onClick={closeDialog}>
                {tCommon('cancel')}
              </Button>
              <Button type='submit' loading={updateMutation.isPending}>
                {tCommon('save')}
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
        title={t('dialog.createTitle')}
        description={t('dialog.createDescription')}
      >
        <Form
          schema={brandSchema}
          defaultValues={{ name: '', status: 'ACTIVE', logoUrl: null }}
          onSubmit={values => createMutation.mutate(values)}
        >
          <Field label={t('fields.name')} required>
            <Input name='name' aria-label={t('fields.name')} placeholder={t('fields.namePlaceholder')} />
          </Field>
          <Field label={t('fields.status')} required>
            <Select name='status' aria-label={t('fields.statusFilter')} options={statusFormOptions} />
          </Field>
          <Field label={t('fields.logo')} hint={t('fields.logoHint')}>
            <BrandLogoField />
          </Field>
          <div className={styles.formActions}>
            <Button type='button' variant='secondary' onClick={closeDialog}>
              {tCommon('cancel')}
            </Button>
            <Button type='submit' loading={createMutation.isPending}>
              {tCommon('save')}
            </Button>
          </div>
        </Form>
      </Dialog>
    );
  };

  return (
    <PageContainer
      title={t('title')}
      description={t('description')}
      actions={
        <Can permission={PERMISSIONS.BRAND_MANAGE}>
          <Button onClick={() => setDialog({ type: 'create' })}>{t('create')}</Button>
        </Can>
      }
    >
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

      {brandsQuery.isError ? (
        <Empty description={tCommon('loadFailed')} />
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
          emptyText={t('empty')}
        />
      )}

      {renderDialog()}
    </PageContainer>
  );
}

export default BrandManager;
