'use client';

import {
  Button,
  Checkbox,
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
import type { DataTableColumns, SelectOptionValue } from '@mtm/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { z } from 'zod';

import { apiFetch } from '@/lib/api-client';
import type { OpsAccountDTO, OpsAccountStatus } from '@/lib/services/account-admin';
import type { OpsRoleDTO } from '@/lib/services/role-admin';
import { translateApiError } from '@/lib/translate-api-error';
import { createAccountCreateSchema, createAccountPasswordSchema } from '@/lib/validation/system';

import styles from './index.module.css';

const PAGE_SIZE = 10;

type CreateValues = z.output<ReturnType<typeof createAccountCreateSchema>>;
type PasswordValues = z.output<ReturnType<typeof createAccountPasswordSchema>>;

interface UpdateAccountBody {
  name?: string;
  status?: OpsAccountStatus;
  roleIds?: string[];
}

interface AccountListResponse {
  items: OpsAccountDTO[];
  total: number;
}

type DialogState =
  | { type: 'create' }
  | { type: 'edit'; account: OpsAccountDTO }
  | { type: 'password'; account: OpsAccountDTO }
  | null;

export interface AccountManagerProps {
  currentAccountId: string;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDateTime(value: string | null, emptyLabel: string): string {
  if (!value) {
    return emptyLabel;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function RoleCheckboxes({ roles, loading }: { roles: OpsRoleDTO[] | undefined; loading: boolean }) {
  const t = useTranslations('system.opsAccounts');

  if (loading) {
    return <p className={styles.muted}>{t('rolesLoading')}</p>;
  }

  if (!roles || roles.length === 0) {
    return <p className={styles.muted}>{t('noRoles')}</p>;
  }

  return (
    <div className={styles.checkboxGroup}>
      {roles.map((role, index) => (
        <Checkbox key={role.id} name='roleIds' value={role.id} label={role.name} showError={index === 0} />
      ))}
    </div>
  );
}

export function AccountManager({ currentAccountId }: AccountManagerProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('system.opsAccounts');
  const tCommon = useTranslations('common');
  const tOps = useTranslations('opsCommon');
  const tStatus = useTranslations('opsCommon.status');
  const tRoot = useTranslations();

  const statusFilterOptions = [
    { value: '', label: tOps('all') },
    { value: 'ACTIVE', label: tStatus('active') },
    { value: 'DISABLED', label: tStatus('disabled') },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: tStatus('active') },
    { value: 'DISABLED', label: tStatus('disabled') },
  ];

  const accountCreateSchema = useMemo(() => createAccountCreateSchema(tRoot), [tRoot]);
  const passwordSchema = useMemo(() => createAccountPasswordSchema(tRoot), [tRoot]);
  const accountEditSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, tRoot('validation.nameRequired')).max(50, tRoot('validation.nameMax')),
        status: z.enum(['ACTIVE', 'DISABLED']),
        roleIds: z.array(z.string()),
      }),
    [tRoot]
  );

  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<SelectOptionValue>('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStatus, setDraftStatus] = useState<SelectOptionValue>('');
  const [dialog, setDialog] = useState<DialogState>(null);

  const params = {
    page,
    pageSize: PAGE_SIZE,
    keyword: keyword || undefined,
    status: status || undefined,
  };

  const accountsQuery = useQuery({
    queryKey: ['ops', 'accounts', params],
    queryFn: () => apiFetch<AccountListResponse>('/api/accounts', { query: params }),
  });

  const rolesQuery = useQuery({
    queryKey: ['ops', 'roles'],
    queryFn: () => apiFetch<OpsRoleDTO[]>('/api/roles'),
  });

  const onRequestError = (error: unknown) => {
    toast.error(translateApiError(error, tRoot, 'common.actionFailed'));
  };

  const invalidateAccounts = () => queryClient.invalidateQueries({ queryKey: ['ops', 'accounts'] });

  const createMutation = useMutation({
    mutationFn: (values: CreateValues) => apiFetch<OpsAccountDTO>('/api/accounts', { method: 'POST', body: values }),
    onSuccess: async () => {
      toast.success(t('toast.created'));
      setDialog(null);
      await invalidateAccounts();
    },
    onError: onRequestError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAccountBody }) =>
      apiFetch<OpsAccountDTO>(`/api/accounts/${id}`, { method: 'PATCH', body }),
    onSuccess: async () => {
      toast.success(t('toast.updated'));
      setDialog(null);
      await invalidateAccounts();
    },
    onError: onRequestError,
  });

  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiFetch<null>(`/api/accounts/${id}/password`, { method: 'POST', body: { password } }),
    onSuccess: async () => {
      toast.success(t('toast.passwordReset'));
      setDialog(null);
      await invalidateAccounts();
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

  const toggleStatus = (account: OpsAccountDTO) => {
    updateMutation.mutate({
      id: account.id,
      body: { status: account.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' },
    });
  };

  const closeDialog = () => setDialog(null);

  const columns: DataTableColumns<OpsAccountDTO> = [
    {
      dataIndex: 'username',
      title: t('columns.username'),
      render: (_, row) => (
        <span className={styles.identity}>
          {row.username}
          {row.id === currentAccountId ? <Tag tone='info'>{t('current')}</Tag> : null}
        </span>
      ),
    },
    {
      dataIndex: 'name',
      title: t('columns.name'),
    },
    {
      key: 'roles',
      title: t('columns.roles'),
      render: (_, row) =>
        row.roles.length > 0 ? (
          <span className={styles.tags}>
            {row.roles.map(role => (
              <Tag key={role.id} tone='neutral'>
                {role.name}
              </Tag>
            ))}
          </span>
        ) : (
          <span className={styles.muted}>--</span>
        ),
    },
    {
      dataIndex: 'status',
      title: t('columns.status'),
      render: (value: OpsAccountStatus) =>
        value === 'ACTIVE' ? (
          <Tag tone='success'>{tStatus('active')}</Tag>
        ) : (
          <Tag tone='danger'>{tStatus('disabled')}</Tag>
        ),
    },
    {
      dataIndex: 'lastLoginAt',
      title: t('columns.lastLogin'),
      render: (value: string | null) => formatDateTime(value, t('neverLoggedIn')),
    },
    {
      key: 'actions',
      title: t('columns.actions'),
      render: (_, row) => (
        <div className={styles.actions}>
          <Button variant='ghost' size='sm' onClick={() => setDialog({ type: 'edit', account: row })}>
            {tCommon('edit')}
          </Button>
          <Button variant='ghost' size='sm' onClick={() => setDialog({ type: 'password', account: row })}>
            {t('dialog.passwordTitle')}
          </Button>
          <Button variant='ghost' size='sm' onClick={() => toggleStatus(row)}>
            {row.status === 'ACTIVE' ? tOps('disable') : tOps('enable')}
          </Button>
        </div>
      ),
    },
  ];

  const list = accountsQuery.data?.items ?? [];

  const renderDialog = () => {
    if (!dialog) {
      return null;
    }

    if (dialog.type === 'password') {
      return (
        <Dialog
          open
          onOpenChange={open => {
            if (!open) closeDialog();
          }}
          title={t('dialog.passwordTitle')}
          description={t('dialog.passwordDescription', { username: dialog.account.username })}
        >
          <Form
            schema={passwordSchema}
            defaultValues={{ password: '' }}
            onSubmit={(values: PasswordValues) =>
              passwordMutation.mutate({ id: dialog.account.id, password: values.password })
            }
          >
            <Field label={t('dialog.newPassword')} required>
              <Input
                name='password'
                type='password'
                aria-label={t('dialog.newPassword')}
                placeholder={t('dialog.passwordPlaceholder')}
                autoComplete='new-password'
              />
            </Field>
            <div className={styles.formActions}>
              <Button type='button' variant='secondary' onClick={closeDialog}>
                {tCommon('cancel')}
              </Button>
              <Button type='submit' loading={passwordMutation.isPending}>
                {tCommon('save')}
              </Button>
            </div>
          </Form>
        </Dialog>
      );
    }

    if (dialog.type === 'edit') {
      return (
        <Dialog
          open
          onOpenChange={open => {
            if (!open) closeDialog();
          }}
          title={t('dialog.editTitle')}
          description={dialog.account.username}
        >
          <Form
            schema={accountEditSchema}
            defaultValues={{
              name: dialog.account.name,
              status: dialog.account.status,
              roleIds: dialog.account.roles.map(role => role.id),
            }}
            onSubmit={values =>
              updateMutation.mutate({
                id: dialog.account.id,
                body: { name: values.name, status: values.status, roleIds: values.roleIds },
              })
            }
          >
            <Field label={t('dialog.name')} required>
              <Input name='name' aria-label={t('dialog.name')} placeholder={t('dialog.namePlaceholder')} />
            </Field>
            <Field label={t('dialog.status')} required>
              <Select name='status' aria-label={t('fields.status')} options={statusOptions} />
            </Field>
            <Field label={t('dialog.roles')}>
              <RoleCheckboxes roles={rolesQuery.data} loading={rolesQuery.isPending} />
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
          schema={accountCreateSchema}
          defaultValues={{ username: '', name: '', password: '', roleIds: [] }}
          onSubmit={values => createMutation.mutate(values)}
        >
          <Field label={t('dialog.username')} required>
            <Input
              name='username'
              aria-label={t('dialog.username')}
              placeholder={t('dialog.usernamePlaceholder')}
              autoComplete='off'
            />
          </Field>
          <Field label={t('dialog.name')} required>
            <Input name='name' aria-label={t('dialog.name')} placeholder={t('dialog.namePlaceholder')} />
          </Field>
          <Field label={t('dialog.password')} required>
            <Input
              name='password'
              type='password'
              aria-label={t('dialog.password')}
              placeholder={t('dialog.passwordPlaceholder')}
              autoComplete='new-password'
            />
          </Field>
          <Field label={t('dialog.roles')}>
            <RoleCheckboxes roles={rolesQuery.data} loading={rolesQuery.isPending} />
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
      actions={<Button onClick={() => setDialog({ type: 'create' })}>{t('create')}</Button>}
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
              onChange={value => setDraftStatus(value)}
            />
          </Field>
        </SearchForm>
      </div>

      {accountsQuery.isError ? (
        <Empty description={tCommon('loadFailed')} />
      ) : (
        <DataTable
          columns={columns}
          data={list}
          total={accountsQuery.data?.total ?? 0}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          rowKey='id'
          loading={accountsQuery.isPending}
          emptyText={t('empty')}
        />
      )}

      {renderDialog()}
    </PageContainer>
  );
}

export default AccountManager;
