'use client';

import { PERMISSIONS } from '@mtm/contracts';
import { PermissionButton } from '@mtm/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { z } from 'zod';

import { PageContainer } from '@/components/layout/PageContainer';
import {
  Button,
  Checkbox,
  DataTable,
  Dialog,
  Empty,
  Field,
  Form,
  Input,
  SearchForm,
  Select,
  Tag,
  useToast,
} from '@/components/ui';
import type { DataTableColumns, SelectOptionValue } from '@/components/ui';
import { ApiError, apiFetch } from '@/lib/api-client';
import type { MerchantAccountDTO, MerchantAccountStatus } from '@/lib/services/account-admin';
import type { MerchantRoleDTO } from '@/lib/services/role-admin';

import styles from './index.module.css';

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'ACTIVE', label: '启用' },
  { value: 'DISABLED', label: '停用' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'DISABLED', label: '停用' },
];

const accountCreateSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9._@-]{3,64}$/, '用户名格式不合法'),
  name: z.string().min(1, '姓名不能为空').max(50, '姓名不得超过 50 个字符'),
  password: z.string().min(8, '密码至少 8 位').max(128, '密码不得超过 128 位'),
  roleIds: z.array(z.string()),
});

const accountEditSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名不得超过 50 个字符'),
  status: z.enum(['ACTIVE', 'DISABLED']),
  roleIds: z.array(z.string()),
});

const passwordSchema = z.object({
  password: z.string().min(8, '密码至少 8 位').max(128, '密码不得超过 128 位'),
});

type CreateValues = z.output<typeof accountCreateSchema>;

interface AccountListResponse {
  items: MerchantAccountDTO[];
  total: number;
}

type DialogState =
  | { type: 'create' }
  | { type: 'edit'; account: MerchantAccountDTO }
  | { type: 'password'; account: MerchantAccountDTO }
  | null;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '从未登录';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function RoleCheckboxes({ roles, loading }: { roles: MerchantRoleDTO[] | undefined; loading: boolean }) {
  if (loading) {
    return <p className={styles.muted}>角色加载中…</p>;
  }

  if (!roles || roles.length === 0) {
    return <p className={styles.muted}>暂无可分配角色</p>;
  }

  return (
    <div className={styles.checkboxGroup}>
      {roles.map((role, index) => (
        <Checkbox key={role.id} name='roleIds' value={role.id} label={role.name} showError={index === 0} />
      ))}
    </div>
  );
}

export function AccountManager() {
  const toast = useToast();
  const queryClient = useQueryClient();

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
    queryKey: ['merchant', 'accounts', params],
    queryFn: () => apiFetch<AccountListResponse>('/api/accounts', { query: params }),
  });

  const rolesQuery = useQuery({
    queryKey: ['merchant', 'roles'],
    queryFn: () => apiFetch<MerchantRoleDTO[]>('/api/roles'),
  });

  const onRequestError = (error: unknown) => {
    toast.error(error instanceof ApiError ? error.message : '操作失败，请稍后重试');
  };

  const invalidateAccounts = () => queryClient.invalidateQueries({ queryKey: ['merchant', 'accounts'] });

  const createMutation = useMutation({
    mutationFn: (values: CreateValues) =>
      apiFetch<MerchantAccountDTO>('/api/accounts', { method: 'POST', body: values }),
    onSuccess: async () => {
      toast.success('子账号已创建');
      setDialog(null);
      await invalidateAccounts();
    },
    onError: onRequestError,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { name?: string; status?: MerchantAccountStatus; roleIds?: string[] };
    }) => apiFetch<MerchantAccountDTO>(`/api/accounts/${id}`, { method: 'PATCH', body }),
    onSuccess: async () => {
      toast.success('子账号已更新');
      setDialog(null);
      await invalidateAccounts();
    },
    onError: onRequestError,
  });

  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiFetch<null>(`/api/accounts/${id}/password`, { method: 'POST', body: { password } }),
    onSuccess: async () => {
      toast.success('密码已重置');
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

  const toggleStatus = (account: MerchantAccountDTO) => {
    updateMutation.mutate({
      id: account.id,
      body: { status: account.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' },
    });
  };

  const closeDialog = () => setDialog(null);

  const columns: DataTableColumns<MerchantAccountDTO> = [
    {
      dataIndex: 'username',
      title: '用户名',
      render: (_, row) => (
        <span className={styles.identity}>
          {row.username}
          {row.isOwner ? <Tag tone='info'>主账号</Tag> : null}
        </span>
      ),
    },
    {
      dataIndex: 'name',
      title: '姓名',
    },
    {
      dataIndex: 'phone',
      title: '手机号',
      render: (value: string | null) => value ?? <span className={styles.muted}>--</span>,
    },
    {
      key: 'roles',
      title: '角色',
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
      title: '状态',
      render: (value: MerchantAccountStatus) =>
        value === 'ACTIVE' ? <Tag tone='success'>启用</Tag> : <Tag tone='danger'>停用</Tag>,
    },
    {
      dataIndex: 'lastLoginAt',
      title: '最近登录',
      render: (value: string | null) => formatDateTime(value),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_, row) =>
        row.isOwner ? (
          <span className={styles.muted}>主账号不可修改</span>
        ) : (
          <div className={styles.actions}>
            <Button variant='ghost' size='sm' onClick={() => setDialog({ type: 'edit', account: row })}>
              编辑
            </Button>
            <Button variant='ghost' size='sm' onClick={() => setDialog({ type: 'password', account: row })}>
              重置密码
            </Button>
            <Button variant='ghost' size='sm' onClick={() => toggleStatus(row)}>
              {row.status === 'ACTIVE' ? '停用' : '启用'}
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
          title='重置密码'
          description={`为子账号 ${dialog.account.username} 设置新密码`}
        >
          <Form
            schema={passwordSchema}
            defaultValues={{ password: '' }}
            onSubmit={values => passwordMutation.mutate({ id: dialog.account.id, password: values.password })}
          >
            <Field label='新密码' required>
              <Input
                name='password'
                type='password'
                aria-label='新密码'
                placeholder='至少 8 位'
                autoComplete='new-password'
              />
            </Field>
            <div className={styles.formActions}>
              <Button type='button' variant='secondary' onClick={closeDialog}>
                取消
              </Button>
              <Button type='submit' loading={passwordMutation.isPending}>
                保存
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
          title='编辑子账号'
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
            <Field label='姓名' required>
              <Input name='name' aria-label='姓名' placeholder='请输入姓名' />
            </Field>
            <Field label='状态' required>
              <Select name='status' aria-label='账号状态' options={STATUS_OPTIONS} />
            </Field>
            <Field label='角色'>
              <RoleCheckboxes roles={rolesQuery.data} loading={rolesQuery.isPending} />
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
        title='新建子账号'
        description='子账号按角色获得权限，主账号始终拥有全部权限。'
      >
        <Form
          schema={accountCreateSchema}
          defaultValues={{ username: '', name: '', password: '', roleIds: [] }}
          onSubmit={values => createMutation.mutate(values)}
        >
          <Field label='用户名' required>
            <Input name='username' aria-label='用户名' placeholder='请输入用户名' autoComplete='off' />
          </Field>
          <Field label='姓名' required>
            <Input name='name' aria-label='姓名' placeholder='请输入姓名' />
          </Field>
          <Field label='密码' required>
            <Input
              name='password'
              type='password'
              aria-label='密码'
              placeholder='至少 8 位'
              autoComplete='new-password'
            />
          </Field>
          <Field label='角色'>
            <RoleCheckboxes roles={rolesQuery.data} loading={rolesQuery.isPending} />
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
      title='子账号管理'
      description='管理商家子账号及其角色分配。'
      actions={
        <PermissionButton permission={PERMISSIONS.ACCOUNT_MANAGE} onClick={() => setDialog({ type: 'create' })}>
          新建账号
        </PermissionButton>
      }
    >
      <div className={styles.toolbar}>
        <SearchForm onSubmit={applyFilters} onReset={resetFilters}>
          <Field label='关键字'>
            <Input
              aria-label='关键字'
              placeholder='用户名或姓名'
              value={draftKeyword}
              onChange={event => setDraftKeyword(event.target.value)}
            />
          </Field>
          <Field label='状态'>
            <Select
              aria-label='账号状态筛选'
              options={STATUS_FILTER_OPTIONS}
              value={draftStatus}
              onChange={value => setDraftStatus(value)}
            />
          </Field>
        </SearchForm>
      </div>

      {accountsQuery.isError ? (
        <Empty description='加载失败' />
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
          emptyText='暂无子账号'
        />
      )}

      {renderDialog()}
    </PageContainer>
  );
}

export default AccountManager;
