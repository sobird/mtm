'use client';

import { PERMISSIONS } from '@mtm/contracts';
import { translatePermissionName, type Translate } from '@mtm/i18n';
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
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { z } from 'zod';

import { apiFetch } from '@/lib/api-client';
import type { OpsPermissionDTO, OpsRoleDTO } from '@/lib/services/role-admin';
import { translateApiError } from '@/lib/translate-api-error';

import styles from './index.module.css';

const PERMISSION_TYPE_ORDER = ['MENU', 'BUTTON', 'API'] as const;

type CreateValues = z.output<ReturnType<typeof buildRoleCreateSchema>>;
type EditValues = z.output<ReturnType<typeof buildRoleEditSchema>>;

function buildRoleCreateSchema(t: Translate) {
  return z.object({
    code: z.string().regex(/^[a-zA-Z0-9._@-]{3,64}$/, t('validation.roleCodeInvalid')),
    name: z.string().min(1, t('validation.nameRequired')).max(50, t('validation.nameMax')),
    permissionCodes: z.array(z.string()),
    merchantScopeText: z.string(),
  });
}

function buildRoleEditSchema(t: Translate) {
  return z.object({
    name: z.string().min(1, t('validation.nameRequired')).max(50, t('validation.nameMax')),
    permissionCodes: z.array(z.string()),
    merchantScopeText: z.string(),
  });
}

interface PermissionGroup {
  type: (typeof PERMISSION_TYPE_ORDER)[number];
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
    items: permissions.filter(permission => permission.type === type),
  })).filter(group => group.items.length > 0);
}

function PermissionCheckboxes({ groups }: { groups: PermissionGroup[] }) {
  const t = useTranslations();
  const tType = useTranslations('system.permissionType');
  const firstCode = groups[0]?.items[0]?.code;

  return (
    <div className={styles.permissionGroups}>
      {groups.map(group => (
        <div key={group.type} className={styles.permissionGroup}>
          <span className={styles.groupTitle}>{tType(group.type)}</span>
          <div className={styles.checkboxGroup}>
            {group.items.map(permission => (
              <Checkbox
                key={permission.code}
                name='permissionCodes'
                value={permission.code}
                label={translatePermissionName(permission.code, permission.name, t)}
                showError={permission.code === firstCode}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RoleManager() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('system.opsRoles');
  const tCommon = useTranslations('common');
  const tRoot = useTranslations();

  const roleCreateSchema = useMemo(() => buildRoleCreateSchema(tRoot), [tRoot]);
  const roleEditSchema = useMemo(() => buildRoleEditSchema(tRoot), [tRoot]);

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
    toast.error(translateApiError(error, tRoot, 'common.actionFailed'));
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
      toast.success(t('toast.created'));
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
      toast.success(t('toast.updated'));
      setDialog(null);
      await invalidateRoles();
    },
    onError: onRequestError,
  });

  const closeDialog = () => setDialog(null);

  const groups = groupPermissions(permissionsQuery.data ?? []);
  const roles = rolesQuery.data ?? [];

  const renderMerchantScope = (role: OpsRoleDTO) => {
    if (role.permissions.includes(PERMISSIONS.PLATFORM_CROSS_TENANT)) {
      return <Tag tone='info'>{t('allMerchants')}</Tag>;
    }

    if (role.merchantScope.length === 0) {
      return <span className={styles.muted}>--</span>;
    }

    return <span className={styles.scope}>{role.merchantScope.join(t('merchantScopeSeparator'))}</span>;
  };

  const columns: DataTableColumns<OpsRoleDTO> = [
    {
      dataIndex: 'name',
      title: t('columns.role'),
      render: (_, row) => (
        <span className={styles.roleName}>
          {row.name}
          <span className={styles.code}>{row.code}</span>
        </span>
      ),
    },
    {
      key: 'permissionCount',
      title: t('columns.permissionCount'),
      render: (_, row) => row.permissions.length,
    },
    {
      dataIndex: 'accountCount',
      title: t('columns.accountCount'),
    },
    {
      key: 'merchantScope',
      title: t('columns.merchantScope'),
      render: (_, row) => renderMerchantScope(row),
    },
    {
      key: 'actions',
      title: t('columns.actions'),
      render: (_, row) => (
        <Button variant='ghost' size='sm' onClick={() => setDialog({ type: 'edit', role: row })}>
          {tCommon('edit')}
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
          title={t('dialog.editTitle')}
          description={t('dialog.editDescription', { code: dialog.role.code })}
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
            <Field label={t('dialog.name')} required>
              <Input name='name' aria-label={t('dialog.name')} placeholder={t('dialog.namePlaceholder')} />
            </Field>
            <Field label={t('dialog.permissions')}>
              <PermissionCheckboxes groups={groups} />
            </Field>
            <Field label={t('dialog.merchantScope')} hint={t('dialog.merchantScopeHint')}>
              <Textarea
                name='merchantScopeText'
                aria-label={t('dialog.merchantScope')}
                placeholder={t('dialog.merchantScopePlaceholder')}
                rows={3}
              />
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
          schema={roleCreateSchema}
          defaultValues={{ code: '', name: '', permissionCodes: [], merchantScopeText: '' }}
          onSubmit={values => createMutation.mutate(values)}
        >
          <Field label={t('dialog.code')} required>
            <Input
              name='code'
              aria-label={t('dialog.code')}
              placeholder={t('dialog.codePlaceholder')}
              autoComplete='off'
            />
          </Field>
          <Field label={t('dialog.name')} required>
            <Input name='name' aria-label={t('dialog.name')} placeholder={t('dialog.namePlaceholder')} />
          </Field>
          <Field label={t('dialog.permissions')}>
            <PermissionCheckboxes groups={groups} />
          </Field>
          <Field label={t('dialog.merchantScope')} hint={t('dialog.merchantScopeHint')}>
            <Textarea
              name='merchantScopeText'
              aria-label={t('dialog.merchantScope')}
              placeholder={t('dialog.merchantScopePlaceholder')}
              rows={3}
            />
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
      {rolesQuery.isError ? (
        <Empty description={tCommon('loadFailed')} />
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
          emptyText={t('empty')}
        />
      )}

      {renderDialog()}
    </PageContainer>
  );
}

export default RoleManager;
