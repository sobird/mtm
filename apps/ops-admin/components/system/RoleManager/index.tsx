'use client';

import { PERMISSIONS } from '@mtm/contracts';
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
  Tag,
  Textarea,
  useToast,
} from '@mtm/ui';
import type { DataTableColumns } from '@mtm/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { z } from 'zod';

import { ApiError, apiFetch } from '@/lib/api-client';
import type { OpsPermissionDTO, OpsRoleDTO } from '@/lib/services/role-admin';

import styles from './index.module.css';

const PERMISSION_TYPE_ORDER = ['MENU', 'BUTTON', 'API'] as const;

const PERMISSION_TYPE_LABELS: Record<string, string> = {
  MENU: '菜单权限',
  BUTTON: '按钮权限',
  API: '接口权限',
};

const roleCreateSchema = z.object({
  code: z.string().regex(/^[a-zA-Z0-9._@-]{3,64}$/, '角色编码格式不合法'),
  name: z.string().min(1, '名称不能为空').max(50, '名称不得超过 50 个字符'),
  permissionCodes: z.array(z.string()),
  merchantScopeText: z.string(),
});

const roleEditSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50, '名称不得超过 50 个字符'),
  permissionCodes: z.array(z.string()),
  merchantScopeText: z.string(),
});

type CreateValues = z.output<typeof roleCreateSchema>;
type EditValues = z.output<typeof roleEditSchema>;

interface PermissionGroup {
  type: string;
  label: string;
  items: OpsPermissionDTO[];
}

type DialogState = { type: 'create' } | { type: 'edit'; role: OpsRoleDTO } | null;

function parseMerchantScope(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[\n,]/)
        .map(item => item.trim())
        .filter(Boolean)
    ),
  ];
}

function groupPermissions(permissions: OpsPermissionDTO[]): PermissionGroup[] {
  return PERMISSION_TYPE_ORDER.map(type => ({
    type,
    label: PERMISSION_TYPE_LABELS[type] ?? type,
    items: permissions.filter(permission => permission.type === type),
  })).filter(group => group.items.length > 0);
}

function PermissionCheckboxes({ groups }: { groups: PermissionGroup[] }) {
  const firstCode = groups[0]?.items[0]?.code;

  return (
    <div className={styles.permissionGroups}>
      {groups.map(group => (
        <div key={group.type} className={styles.permissionGroup}>
          <span className={styles.groupTitle}>{group.label}</span>
          <div className={styles.checkboxGroup}>
            {group.items.map(permission => (
              <Checkbox
                key={permission.code}
                name='permissionCodes'
                value={permission.code}
                label={permission.name}
                showError={permission.code === firstCode}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderMerchantScope(role: OpsRoleDTO) {
  if (role.permissions.includes(PERMISSIONS.PLATFORM_CROSS_TENANT)) {
    return <Tag tone='info'>全部商家</Tag>;
  }

  if (role.merchantScope.length === 0) {
    return <span className={styles.muted}>--</span>;
  }

  return <span className={styles.scope}>{role.merchantScope.join('、')}</span>;
}

export function RoleManager() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [dialog, setDialog] = useState<DialogState>(null);

  const rolesQuery = useQuery({
    queryKey: ['ops', 'roles'],
    queryFn: () => apiFetch<OpsRoleDTO[]>('/api/roles'),
  });

  const permissionsQuery = useQuery({
    queryKey: ['ops', 'permissions'],
    queryFn: () => apiFetch<OpsPermissionDTO[]>('/api/permissions'),
  });

  const onRequestError = (error: unknown) => {
    toast.error(error instanceof ApiError ? error.message : '操作失败，请稍后重试');
  };

  const invalidateRoles = () => queryClient.invalidateQueries({ queryKey: ['ops', 'roles'] });

  const createMutation = useMutation({
    mutationFn: (values: CreateValues) =>
      apiFetch<OpsRoleDTO>('/api/roles', {
        method: 'POST',
        body: {
          code: values.code,
          name: values.name,
          permissionCodes: values.permissionCodes,
          merchantScope: parseMerchantScope(values.merchantScopeText),
        },
      }),
    onSuccess: async () => {
      toast.success('角色已创建');
      setDialog(null);
      await invalidateRoles();
    },
    onError: onRequestError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: EditValues }) =>
      apiFetch<OpsRoleDTO>(`/api/roles/${id}`, {
        method: 'PATCH',
        body: {
          name: values.name,
          permissionCodes: values.permissionCodes,
          merchantScope: parseMerchantScope(values.merchantScopeText),
        },
      }),
    onSuccess: async () => {
      toast.success('角色已更新');
      setDialog(null);
      await invalidateRoles();
    },
    onError: onRequestError,
  });

  const closeDialog = () => setDialog(null);

  const groups = groupPermissions(permissionsQuery.data ?? []);
  const roles = rolesQuery.data ?? [];

  const columns: DataTableColumns<OpsRoleDTO> = [
    {
      dataIndex: 'name',
      title: '角色',
      render: (_, row) => (
        <span className={styles.roleName}>
          {row.name}
          <span className={styles.code}>{row.code}</span>
        </span>
      ),
    },
    {
      key: 'permissionCount',
      title: '权限数',
      render: (_, row) => row.permissions.length,
    },
    {
      dataIndex: 'accountCount',
      title: '账号数',
    },
    {
      key: 'merchantScope',
      title: '商家范围',
      render: (_, row) => renderMerchantScope(row),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_, row) => (
        <Button variant='ghost' size='sm' onClick={() => setDialog({ type: 'edit', role: row })}>
          编辑
        </Button>
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
          title='编辑角色'
          description={`角色编码：${dialog.role.code}`}
        >
          <Form
            schema={roleEditSchema}
            defaultValues={{
              name: dialog.role.name,
              permissionCodes: dialog.role.permissions,
              merchantScopeText: dialog.role.merchantScope.join('\n'),
            }}
            onSubmit={values => updateMutation.mutate({ id: dialog.role.id, values })}
          >
            <Field label='角色名称' required>
              <Input name='name' aria-label='角色名称' placeholder='请输入角色名称' />
            </Field>
            <Field label='权限'>
              <PermissionCheckboxes groups={groups} />
            </Field>
            <Field label='商家范围' hint='每行一个商家 ID；拥有跨商家权限时忽略'>
              <Textarea name='merchantScopeText' aria-label='商家范围' placeholder='每行一个商家 ID' rows={3} />
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
        title='新建角色'
        description='角色编码创建后不可修改。'
      >
        <Form
          schema={roleCreateSchema}
          defaultValues={{ code: '', name: '', permissionCodes: [], merchantScopeText: '' }}
          onSubmit={values => createMutation.mutate(values)}
        >
          <Field label='角色编码' required>
            <Input name='code' aria-label='角色编码' placeholder='请输入角色编码' autoComplete='off' />
          </Field>
          <Field label='角色名称' required>
            <Input name='name' aria-label='角色名称' placeholder='请输入角色名称' />
          </Field>
          <Field label='权限'>
            <PermissionCheckboxes groups={groups} />
          </Field>
          <Field label='商家范围' hint='每行一个商家 ID；拥有跨商家权限时忽略'>
            <Textarea name='merchantScopeText' aria-label='商家范围' placeholder='每行一个商家 ID' rows={3} />
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
      title='角色管理'
      description='维护角色权限与商家范围。'
      actions={<Button onClick={() => setDialog({ type: 'create' })}>新建角色</Button>}
    >
      {rolesQuery.isError ? (
        <Empty description='加载失败' />
      ) : (
        <DataTable
          columns={columns}
          data={roles}
          total={roles.length}
          page={1}
          pageSize={Math.max(roles.length, 10)}
          onPageChange={() => {}}
          rowKey='id'
          loading={rolesQuery.isPending}
          emptyText='暂无角色'
        />
      )}

      {renderDialog()}
    </PageContainer>
  );
}

export default RoleManager;
