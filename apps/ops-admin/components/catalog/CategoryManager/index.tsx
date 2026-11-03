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
import { useState } from 'react';
import { z } from 'zod';

import { ApiError, apiFetch } from '@/lib/api-client';

import styles from './index.module.css';

const categorySchema = z.object({
  name: z.string().trim().min(1, '类目名称不能为空').max(50, '类目名称不得超过 50 个字符'),
  sort: z.coerce.number().int('排序必须为整数').min(0, '排序不能为负数'),
  status: z.enum(['ACTIVE', 'DISABLED']),
});

type CategoryFormValues = z.output<typeof categorySchema>;

type AttributeType = CategoryAttributeInput['type'];

interface AttributeDraft {
  key: string;
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

const STATUS_LABELS: Record<CategoryNodeDTO['status'], string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
};

const ATTRIBUTE_TYPE_OPTIONS: { value: AttributeType; label: string }[] = [
  { value: 'TEXT', label: '文本' },
  { value: 'NUMBER', label: '数字' },
  { value: 'SELECT', label: '选项' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'DISABLED', label: '停用' },
];

function createEmptyAttribute(): AttributeDraft {
  return { key: nextAttributeKey(), name: '', type: 'TEXT', required: false, options: '' };
}

function toDraft(attribute: CategoryAttributeInput): AttributeDraft {
  return {
    key: nextAttributeKey(),
    name: attribute.name,
    type: attribute.type,
    required: attribute.required,
    options: attribute.options.join(', '),
  };
}

function fromDrafts(drafts: AttributeDraft[]): CategoryAttributeInput[] {
  return drafts
    .filter(draft => draft.name.trim().length > 0)
    .map((draft, index) => ({
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
    }));
}

function AttributeEditor({
  drafts,
  onChange,
}: {
  drafts: AttributeDraft[];
  onChange: (drafts: AttributeDraft[]) => void;
}) {
  const updateDraft = (index: number, patch: Partial<AttributeDraft>) => {
    onChange(drafts.map((draft, current) => (current === index ? { ...draft, ...patch } : draft)));
  };

  return (
    <div className={styles.attributes}>
      {drafts.length === 0 ? <p className={styles.attributeEmpty}>暂无属性</p> : null}

      {drafts.map((draft, index) => (
        <div key={draft.key} className={styles.attributeRow}>
          <Input
            aria-label={`属性名称 ${index + 1}`}
            placeholder='属性名称'
            value={draft.name}
            onChange={event => updateDraft(index, { name: event.target.value })}
          />
          <Select
            aria-label={`属性类型 ${index + 1}`}
            options={ATTRIBUTE_TYPE_OPTIONS}
            value={draft.type}
            onChange={value => updateDraft(index, { type: value as AttributeType })}
          />
          <Checkbox
            aria-label={`属性必填 ${index + 1}`}
            label='必填'
            checked={draft.required}
            onChange={event => updateDraft(index, { required: event.target.checked })}
          />
          <Input
            aria-label={`属性选项 ${index + 1}`}
            placeholder='选项，用逗号分隔'
            value={draft.options}
            disabled={draft.type !== 'SELECT'}
            onChange={event => updateDraft(index, { options: event.target.value })}
          />
          <Button variant='ghost' size='sm' onClick={() => onChange(drafts.filter((_, current) => current !== index))}>
            移除
          </Button>
        </div>
      ))}

      <Button variant='secondary' size='sm' onClick={() => onChange([...drafts, createEmptyAttribute()])}>
        添加属性
      </Button>
    </div>
  );
}

export function CategoryManager() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [dialog, setDialog] = useState<DialogState>(null);
  const [attributeDrafts, setAttributeDrafts] = useState<AttributeDraft[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<CategoryNodeDTO | null>(null);

  const treeQuery = useQuery({
    queryKey: ['ops', 'categories', 'tree'],
    queryFn: () => apiFetch<CategoryNodeDTO[]>('/api/bff/categories/tree'),
  });

  const onRequestError = (error: unknown) => {
    toast.error(error instanceof ApiError ? error.message : '操作失败，请稍后重试');
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
      toast.success('类目已创建');
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
      toast.success('类目已更新');
      setDialog(null);
      await invalidateTree();
    },
    onError: onRequestError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch<null>(`/api/bff/categories/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      toast.success('类目已删除');
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
      title: '类目名称',
      render: (_, row) => (
        <span className={styles.name} style={{ paddingLeft: (row.level - 1) * 20 }}>
          {row.name}
        </span>
      ),
    },
    {
      key: 'level',
      title: '层级',
      width: 80,
      render: (_, row) => row.level,
    },
    {
      key: 'sort',
      title: '排序',
      width: 80,
      render: (_, row) => row.sort,
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (_, row) => <Tag tone={row.status === 'ACTIVE' ? 'success' : 'neutral'}>{STATUS_LABELS[row.status]}</Tag>,
    },
    {
      key: 'attributeCount',
      title: '属性数',
      width: 90,
      render: (_, row) => row.attributes.length,
    },
    {
      key: 'actions',
      title: '操作',
      width: 220,
      render: (_, row) => (
        <Can permission={PERMISSIONS.CATEGORY_MANAGE}>
          <div className={styles.actions}>
            {row.level < 3 ? (
              <Button variant='ghost' size='sm' onClick={() => openCreate(row.id)}>
                添加子类
              </Button>
            ) : null}
            <Button variant='ghost' size='sm' onClick={() => openEdit(row)}>
              编辑
            </Button>
            <Button variant='ghost' size='sm' onClick={() => setDeleteTarget(row)}>
              删除
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
        : '一级类目';

      return (
        <Dialog
          open
          onOpenChange={open => {
            if (!open) closeDialog();
          }}
          title='编辑类目'
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
            <Field label='所属父类目'>
              <span className={styles.readonly}>{parentName}</span>
            </Field>
            <Field label='类目名称' required>
              <Input name='name' aria-label='类目名称' placeholder='请输入类目名称' />
            </Field>
            <Field label='排序' required>
              <Input name='sort' type='number' min={0} aria-label='排序' />
            </Field>
            <Field label='状态' required>
              <Select name='status' aria-label='状态' options={STATUS_OPTIONS} />
            </Field>
            <Field label='属性'>
              <AttributeEditor drafts={attributeDrafts} onChange={setAttributeDrafts} />
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

    const parentName = dialog.parentId
      ? (nodes.find(node => node.id === dialog.parentId)?.name ?? dialog.parentId)
      : null;

    return (
      <Dialog
        open
        onOpenChange={open => {
          if (!open) closeDialog();
        }}
        title={dialog.parentId ? '新建子类目' : '新建一级类目'}
        description={parentName ? `所属父类目：${parentName}` : undefined}
      >
        <Form
          schema={categorySchema}
          defaultValues={{ name: '', sort: 0, status: 'ACTIVE' }}
          onSubmit={values => createMutation.mutate({ parentId: dialog.parentId, values })}
        >
          {parentName ? (
            <Field label='所属父类目'>
              <span className={styles.readonly}>{parentName}</span>
            </Field>
          ) : null}
          <Field label='类目名称' required>
            <Input name='name' aria-label='类目名称' placeholder='请输入类目名称' />
          </Field>
          <Field label='排序' required>
            <Input name='sort' type='number' min={0} aria-label='排序' />
          </Field>
          <Field label='状态' required>
            <Select name='status' aria-label='状态' options={STATUS_OPTIONS} />
          </Field>
          <Field label='属性'>
            <AttributeEditor drafts={attributeDrafts} onChange={setAttributeDrafts} />
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
      title='类目管理'
      description='维护类目层级、状态与属性定义。'
      actions={
        <Can permission={PERMISSIONS.CATEGORY_MANAGE}>
          <Button onClick={() => openCreate(null)}>新建一级类目</Button>
        </Can>
      }
    >
      {treeQuery.isError ? (
        <Empty description='加载失败' />
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
          emptyText='暂无类目'
        />
      )}

      {renderDialog()}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
        title='删除类目'
        description={deleteTarget ? `确认删除类目「${deleteTarget.name}」？` : undefined}
      >
        <p className={styles.deleteHint}>删除后不可恢复，请确认该类目下没有子类目或商品。</p>
        <div className={styles.formActions}>
          <Button type='button' variant='secondary' onClick={() => setDeleteTarget(null)}>
            取消
          </Button>
          <Button
            variant='danger'
            loading={deleteMutation.isPending}
            onClick={() => {
              if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
            }}
          >
            确认删除
          </Button>
        </div>
      </Dialog>
    </PageContainer>
  );
}

export default CategoryManager;
