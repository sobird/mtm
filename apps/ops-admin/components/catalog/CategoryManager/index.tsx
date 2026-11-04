'use client';

import { PERMISSIONS } from '@mtm/contracts';
import type { CategoryAttributeInput, CategoryCreateInput, CategoryNodeDTO, CategoryUpdateInput } from '@mtm/contracts';
import {
  Button,
  Can,
  Checkbox,
  DataTable,
  Dialog,
  Empty,
  Field,
  Form,
  Input,
  PageContainer,
  Select,
  Tag,
  useToast,
} from '@mtm/ui';
import type { DataTableColumns } from '@mtm/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { z } from 'zod';

import { apiFetch } from '@/lib/api-client';
import { translateApiError } from '@/lib/translate-api-error';

import styles from './index.module.css';

type AttributeType = CategoryAttributeInput['type'];

interface AttributeDraft {
  key: string;
  id?: string;
  name: string;
  type: AttributeType;
  required: boolean;
  options: string;
}

let attributeKeySeq = 0;

function nextAttributeKey(): string {
  attributeKeySeq += 1;
  return `attribute-${attributeKeySeq}`;
}

type DialogState = { type: 'create'; parentId: string | null } | { type: 'edit'; category: CategoryNodeDTO } | null;

function createEmptyAttribute(): AttributeDraft {
  return { key: nextAttributeKey(), name: '', type: 'TEXT', required: false, options: '' };
}

function toDraft(attribute: CategoryAttributeInput): AttributeDraft {
  return {
    key: nextAttributeKey(),
    id: attribute.id,
    name: attribute.name,
    type: attribute.type,
    required: attribute.required,
    options: attribute.options.join(', '),
  };
}

function fromDrafts(drafts: AttributeDraft[]): CategoryAttributeInput[] {
  return drafts
    .filter(draft => draft.name.trim().length > 0)
    .map((draft, index) => {
      const input: CategoryAttributeInput = {
        name: draft.name.trim(),
        type: draft.type,
        required: draft.required,
        options:
          draft.type === 'SELECT'
            ? draft.options
                .split(',')
                .map(option => option.trim())
                .filter(Boolean)
            : [],
        sort: index,
      };

      if (draft.id) {
        input.id = draft.id;
      }

      return input;
    });
}

function AttributeEditor({
  drafts,
  onChange,
}: {
  drafts: AttributeDraft[];
  onChange: (drafts: AttributeDraft[]) => void;
}) {
  const t = useTranslations('catalog.categories');
  const attributeTypeOptions: { value: AttributeType; label: string }[] = [
    { value: 'TEXT', label: t('attribute.typeOptions.TEXT') },
    { value: 'NUMBER', label: t('attribute.typeOptions.NUMBER') },
    { value: 'SELECT', label: t('attribute.typeOptions.SELECT') },
  ];

  const updateDraft = (index: number, patch: Partial<AttributeDraft>) => {
    onChange(drafts.map((draft, current) => (current === index ? { ...draft, ...patch } : draft)));
  };

  return (
    <div className={styles.attributes}>
      {drafts.length === 0 ? <p className={styles.attributeEmpty}>{t('attribute.empty')}</p> : null}

      {drafts.map((draft, index) => (
        <div key={draft.key} className={styles.attributeRow}>
          <Input
            aria-label={t('attribute.nameAria', { index: index + 1 })}
            placeholder={t('attribute.namePlaceholder')}
            value={draft.name}
            onChange={event => updateDraft(index, { name: event.target.value })}
          />
          <Select
            aria-label={t('attribute.typeAria', { index: index + 1 })}
            options={attributeTypeOptions}
            value={draft.type}
            onChange={value => updateDraft(index, { type: value as AttributeType })}
          />
          <Checkbox
            aria-label={t('attribute.requiredAria', { index: index + 1 })}
            label={t('attribute.required')}
            checked={draft.required}
            onChange={event => updateDraft(index, { required: event.target.checked })}
          />
          <Input
            aria-label={t('attribute.optionsAria', { index: index + 1 })}
            placeholder={t('attribute.optionsPlaceholder')}
            value={draft.options}
            disabled={draft.type !== 'SELECT'}
            onChange={event => updateDraft(index, { options: event.target.value })}
          />
          <Button variant='ghost' size='sm' onClick={() => onChange(drafts.filter((_, current) => current !== index))}>
            {t('attribute.remove')}
          </Button>
        </div>
      ))}

      <Button variant='secondary' size='sm' onClick={() => onChange([...drafts, createEmptyAttribute()])}>
        {t('attribute.add')}
      </Button>
    </div>
  );
}

export function CategoryManager() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('catalog.categories');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('opsCommon.status');
  const tRoot = useTranslations();

  const categorySchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, tRoot('validation.categoryNameRequired'))
          .max(50, tRoot('validation.categoryNameMax')),
        sort: z.coerce.number().int(tRoot('validation.sortInteger')).min(0, tRoot('validation.sortNonNegative')),
        status: z.enum(['ACTIVE', 'DISABLED']),
      }),
    [tRoot]
  );

  const statusOptions = [
    { value: 'ACTIVE', label: tStatus('active') },
    { value: 'DISABLED', label: tStatus('disabled') },
  ];

  type CategoryFormValues = z.output<typeof categorySchema>;

  const [dialog, setDialog] = useState<DialogState>(null);
  const [attributeDrafts, setAttributeDrafts] = useState<AttributeDraft[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<CategoryNodeDTO | null>(null);

  const treeQuery = useQuery({
    queryKey: ['ops', 'categories', 'tree'],
    queryFn: () => apiFetch<CategoryNodeDTO[]>('/api/bff/categories/tree'),
  });

  const onRequestError = (error: unknown) => {
    toast.error(translateApiError(error, tRoot, 'common.actionFailed'));
  };

  const invalidateTree = () => queryClient.invalidateQueries({ queryKey: ['ops', 'categories', 'tree'] });

  const createMutation = useMutation({
    mutationFn: ({ parentId, values }: { parentId: string | null; values: CategoryFormValues }) => {
      const body: Pick<CategoryCreateInput, 'name' | 'sort' | 'status'> & Partial<CategoryCreateInput> = {
        name: values.name,
        sort: values.sort,
        status: values.status,
      };

      if (parentId) {
        body.parentId = parentId;
      }

      const attributes = fromDrafts(attributeDrafts);
      if (attributes.length > 0) {
        body.attributes = attributes;
      }

      return apiFetch<CategoryNodeDTO>('/api/bff/categories', { method: 'POST', body });
    },
    onSuccess: async () => {
      toast.success(t('toast.created'));
      setDialog(null);
      await invalidateTree();
    },
    onError: onRequestError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: CategoryFormValues }) => {
      const body: CategoryUpdateInput = {
        name: values.name,
        sort: values.sort,
        status: values.status,
        attributes: fromDrafts(attributeDrafts),
      };

      return apiFetch<CategoryNodeDTO>(`/api/bff/categories/${id}`, { method: 'PATCH', body });
    },
    onSuccess: async () => {
      toast.success(t('toast.updated'));
      setDialog(null);
      await invalidateTree();
    },
    onError: onRequestError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch<null>(`/api/bff/categories/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      toast.success(t('toast.deleted'));
      setDeleteTarget(null);
      await invalidateTree();
    },
    onError: onRequestError,
  });

  const openCreate = (parentId: string | null) => {
    setAttributeDrafts([]);
    setDialog({ type: 'create', parentId });
  };

  const openEdit = (category: CategoryNodeDTO) => {
    setAttributeDrafts(category.attributes.map(toDraft));
    setDialog({ type: 'edit', category });
  };

  const closeDialog = () => setDialog(null);

  const nodes = treeQuery.data ?? [];

  const columns: DataTableColumns<CategoryNodeDTO> = [
    {
      key: 'name',
      title: t('columns.name'),
      render: (_, row) => (
        <span className={styles.name} style={{ paddingLeft: (row.level - 1) * 20 }}>
          {row.name}
        </span>
      ),
    },
    {
      key: 'level',
      title: t('columns.level'),
      width: 80,
      render: (_, row) => row.level,
    },
    {
      key: 'sort',
      title: t('columns.sort'),
      width: 80,
      render: (_, row) => row.sort,
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
      key: 'attributeCount',
      title: t('columns.attributeCount'),
      width: 90,
      render: (_, row) => row.attributes.length,
    },
    {
      key: 'actions',
      title: t('columns.actions'),
      width: 220,
      render: (_, row) => (
        <Can permission={PERMISSIONS.CATEGORY_MANAGE}>
          <div className={styles.actions}>
            {row.level < 3 ? (
              <Button variant='ghost' size='sm' onClick={() => openCreate(row.id)}>
                {t('addChild')}
              </Button>
            ) : null}
            <Button variant='ghost' size='sm' onClick={() => openEdit(row)}>
              {tCommon('edit')}
            </Button>
            <Button variant='ghost' size='sm' onClick={() => setDeleteTarget(row)}>
              {tCommon('delete')}
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
      const { category } = dialog;
      const parentName = category.parentId
        ? (nodes.find(node => node.id === category.parentId)?.name ?? category.parentId)
        : t('rootLevel');

      return (
        <Dialog
          open
          onOpenChange={open => {
            if (!open) closeDialog();
          }}
          title={t('dialog.editTitle')}
          description={category.path}
        >
          <Form
            schema={categorySchema}
            defaultValues={{
              name: category.name,
              sort: category.sort,
              status: category.status,
            }}
            onSubmit={values => updateMutation.mutate({ id: category.id, values })}
          >
            <Field label={t('fields.parent')}>
              <span className={styles.readonly}>{parentName}</span>
            </Field>
            <Field label={t('fields.name')} required>
              <Input name='name' aria-label={t('fields.name')} placeholder={t('fields.namePlaceholder')} />
            </Field>
            <Field label={t('fields.sort')} required>
              <Input name='sort' type='number' min={0} aria-label={t('fields.sort')} />
            </Field>
            <Field label={t('fields.status')} required>
              <Select name='status' aria-label={t('fields.status')} options={statusOptions} />
            </Field>
            <Field label={t('fields.attributes')}>
              <AttributeEditor drafts={attributeDrafts} onChange={setAttributeDrafts} />
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

    const parentName = dialog.parentId
      ? (nodes.find(node => node.id === dialog.parentId)?.name ?? dialog.parentId)
      : null;

    return (
      <Dialog
        open
        onOpenChange={open => {
          if (!open) closeDialog();
        }}
        title={dialog.parentId ? t('dialog.createChildTitle') : t('dialog.createRootTitle')}
        description={parentName ? t('fields.parentDescription', { name: parentName }) : undefined}
      >
        <Form
          schema={categorySchema}
          defaultValues={{ name: '', sort: 0, status: 'ACTIVE' }}
          onSubmit={values => createMutation.mutate({ parentId: dialog.parentId, values })}
        >
          {parentName ? (
            <Field label={t('fields.parent')}>
              <span className={styles.readonly}>{parentName}</span>
            </Field>
          ) : null}
          <Field label={t('fields.name')} required>
            <Input name='name' aria-label={t('fields.name')} placeholder={t('fields.namePlaceholder')} />
          </Field>
          <Field label={t('fields.sort')} required>
            <Input name='sort' type='number' min={0} aria-label={t('fields.sort')} />
          </Field>
          <Field label={t('fields.status')} required>
            <Select name='status' aria-label={t('fields.status')} options={statusOptions} />
          </Field>
          <Field label={t('fields.attributes')}>
            <AttributeEditor drafts={attributeDrafts} onChange={setAttributeDrafts} />
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
        <Can permission={PERMISSIONS.CATEGORY_MANAGE}>
          <Button onClick={() => openCreate(null)}>{t('create')}</Button>
        </Can>
      }
    >
      {treeQuery.isError ? (
        <Empty description={tCommon('loadFailed')} />
      ) : (
        <DataTable
          columns={columns}
          data={nodes}
          total={nodes.length}
          page={1}
          pageSize={Math.max(nodes.length, 10)}
          onPageChange={() => {}}
          rowKey='id'
          loading={treeQuery.isPending}
          emptyText={t('empty')}
        />
      )}

      {renderDialog()}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
        title={t('dialog.deleteTitle')}
        description={deleteTarget ? t('dialog.deleteConfirm', { name: deleteTarget.name }) : undefined}
      >
        <p className={styles.deleteHint}>{t('dialog.deleteHint')}</p>
        <div className={styles.formActions}>
          <Button type='button' variant='secondary' onClick={() => setDeleteTarget(null)}>
            {tCommon('cancel')}
          </Button>
          <Button
            variant='danger'
            loading={deleteMutation.isPending}
            onClick={() => {
              if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
            }}
          >
            {t('dialog.confirmDelete')}
          </Button>
        </div>
      </Dialog>
    </PageContainer>
  );
}

export default CategoryManager;
