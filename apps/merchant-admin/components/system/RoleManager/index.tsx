'use client';

import { PERMISSIONS } from '@mtm/contracts';
import { translatePermissionName } from '@mtm/i18n';
import { PermissionButton } from '@mtm/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { z } from 'zod';

import { PageContainer } from '@/components/layout/PageContainer';
import { Button, Checkbox, DataTable, Dialog, Empty, Field, Form, Input, useToast } from '@/components/ui';
import type { DataTableColumns } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import type { MerchantPermissionDTO, MerchantRoleDTO } from '@/lib/services/role-admin';
import { translateApiError } from '@/lib/translate-api-error';
import { createRoleCreateSchema, createRoleUpdateSchema } from '@/lib/validation/system';

import styles from './index.module.css';

const PERMISSION_TYPE_ORDER = ['MENU', 'BUTTON', 'API'] as const;

type CreateValues = z.output<ReturnType<typeof createRoleCreateSchema>>;
type EditValues = z.output<ReturnType<typeof createRoleUpdateSchema>>;

interface PermissionGroup {
  type: string;
  label: string;
  items: MerchantPermissionDTO[];
}

type DialogState = { type: 'create' } | { type: 'edit'; role: MerchantRoleDTO } | null;

function PermissionCheckboxes({ groups }: { groups: PermissionGroup[] }) {
  const t = useTranslations();
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
  const t = useTranslations('system.roles');
  const tPermissionType = useTranslations('system.permissionType');
  const tCommon = useTranslations('common');
  const tRoot = useTranslations();

  const roleCreateSchema = createRoleCreateSchema(tRoot);
  const roleEditSchema = createRoleUpdateSchema(tRoot);

  const [dialog, setDialog] = useState<DialogState>(null);

  const rolesQuery = useQuery({
    queryKey: ['merchant', 'roles'],
    queryFn: () => apiFetch<MerchantRoleDTO[]>('/api/roles'),
  });

  const permissionsQuery = useQuery({
    queryKey: ['merchant', 'permissions'],
    queryFn: () => apiFetch<MerchantPermissionDTO[]>('/api/permissions'),
  });

  const onRequestError = (error: unknown) => {
    toast.error(translateApiError(error, tRoot, 'common.actionFailed'));
  };

  const invalidateRoles = () => queryClient.invalidateQueries({ queryKey: ['merchant', 'roles'] });

  const createMutation = useMutation({
    mutationFn: (values: CreateValues) =>
      apiFetch<MerchantRoleDTO>('/api/roles', {
        method: 'POST',
        body: {
          code: values.code,
          name: values.name,
          permissionCodes: values.permissionCodes,
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
      apiFetch<MerchantRoleDTO>(`/api/roles/${id}`, {
        method: 'PATCH',
        body: {
          name: values.name,
          permissionCodes: values.permissionCodes,
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

  const groups: PermissionGroup[] = PERMISSION_TYPE_ORDER.map(type => ({
    type,
    label: tPermissionType(type),
    items: (permissionsQuery.data ?? []).filter(permission => permission.type === type),
  })).filter(group => group.items.length > 0);

  const roles = rolesQuery.data ?? [];

  const columns: DataTableColumns<MerchantRoleDTO> = [
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
            }}
            onSubmit={values => updateMutation.mutate({ id: dialog.role.id, values })}
          >
            <Field label={t('dialog.name')} required>
              <Input name='name' aria-label={t('dialog.name')} placeholder={t('dialog.namePlaceholder')} />
            </Field>
            <Field label={t('dialog.permissions')}>
              <PermissionCheckboxes groups={groups} />
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
          defaultValues={{ code: '', name: '', permissionCodes: [] }}
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
        <PermissionButton permission={PERMISSIONS.ROLE_MANAGE} onClick={() => setDialog({ type: 'create' })}>
          {t('create')}
        </PermissionButton>
      }
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
