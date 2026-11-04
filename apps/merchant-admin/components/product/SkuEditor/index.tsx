'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button, Field, Input, Select } from '@/components/ui';

import type { ProductFormValues, SkuFormRow } from '../ProductForm/schema';

export type { SkuFormRow };

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'DISABLED', label: '停用' },
];

export interface SkuEditorProps {
  disabled?: boolean;
}

/** 空 SKU 行；至少保留一行供用户填写。 */
export function createEmptySku(): SkuFormRow {
  return { skuCode: '', specsText: '', price: '', stock: '', status: 'ACTIVE' };
}

/** 商品 SKU 行编辑，基于 `useFieldArray` 获得稳定行 key。 */
export function SkuEditor({ disabled = false }: SkuEditorProps) {
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'skus' });

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {fields.map((row, index) => (
        <div
          key={row.id}
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(120px, 1fr) minmax(120px, 1fr) minmax(110px, 0.8fr) minmax(90px, 0.6fr) minmax(110px, 0.7fr) auto',
            gap: 12,
            alignItems: 'start',
            padding: 12,
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <Field label={`SKU 编码 ${index + 1}`}>
            <Input
              name={`skus.${index}.skuCode`}
              aria-label={`SKU 编码 ${index + 1}`}
              maxLength={50}
              disabled={disabled}
            />
          </Field>

          <Field label='规格'>
            <Input
              name={`skus.${index}.specsText`}
              aria-label={`规格 ${index + 1}`}
              maxLength={50}
              disabled={disabled}
            />
          </Field>

          <Field label='价格'>
            <Input
              name={`skus.${index}.price`}
              aria-label={`价格 ${index + 1}`}
              type='number'
              min={0}
              step='0.01'
              disabled={disabled}
            />
          </Field>

          <Field label='库存'>
            <Input
              name={`skus.${index}.stock`}
              aria-label={`库存 ${index + 1}`}
              type='number'
              min={0}
              step='1'
              disabled={disabled}
            />
          </Field>

          <Field label='状态'>
            <Select
              name={`skus.${index}.status`}
              aria-label={`SKU 状态 ${index + 1}`}
              options={STATUS_OPTIONS}
              disabled={disabled}
            />
          </Field>

          <Button
            variant='ghost'
            size='sm'
            aria-label={`删除 SKU ${index + 1}`}
            disabled={disabled || fields.length <= 1}
            onClick={() => remove(index)}
          >
            删除
          </Button>
        </div>
      ))}

      <div>
        <Button variant='secondary' size='sm' disabled={disabled} onClick={() => append(createEmptySku())}>
          新增 SKU
        </Button>
      </div>
    </div>
  );
}

export default SkuEditor;
