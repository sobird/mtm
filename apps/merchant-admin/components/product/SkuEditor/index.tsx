'use client';

import { Button, Field, Input, Select } from '@/components/ui';

import type { ProductFormState } from '../ProductForm/payload';

export type SkuFormRow = ProductFormState['skus'][number];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'DISABLED', label: '停用' },
];

export interface SkuEditorProps {
  value: SkuFormRow[];
  onChange: (rows: SkuFormRow[]) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
}

/** 空 SKU 行；至少保留一行供用户填写。 */
export function createEmptySku(): SkuFormRow {
  return { skuCode: '', specsText: '', price: '', stock: '', status: 'ACTIVE' };
}

/** 商品 SKU 行编辑，支持增删与编辑态回填。 */
export function SkuEditor({ value, onChange, disabled = false, errors = {} }: SkuEditorProps) {
  const updateRow = (index: number, patch: Partial<SkuFormRow>) => {
    onChange(value.map((row, current) => (current === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    onChange([...value, createEmptySku()]);
  };

  const removeRow = (index: number) => {
    if (value.length <= 1) {
      return;
    }

    onChange(value.filter((_, current) => current !== index));
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {value.map((row, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key -- 表单行没有稳定 ID，顺序即身份
          key={index}
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(120px, 1fr) minmax(120px, 1fr) minmax(110px, 0.8fr) minmax(90px, 0.6fr) minmax(110px, 0.7fr) auto',
            gap: 12,
            alignItems: 'end',
            padding: 12,
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <Field label={`SKU 编码 ${index + 1}`} error={errors[`skus.${index}.skuCode`]}>
            <Input
              aria-label={`SKU 编码 ${index + 1}`}
              value={row.skuCode}
              maxLength={50}
              disabled={disabled}
              onChange={event => updateRow(index, { skuCode: event.target.value })}
            />
          </Field>

          <Field label='规格' error={errors[`skus.${index}.specsText`]}>
            <Input
              aria-label={`规格 ${index + 1}`}
              value={row.specsText}
              maxLength={50}
              disabled={disabled}
              onChange={event => updateRow(index, { specsText: event.target.value })}
            />
          </Field>

          <Field label='价格' error={errors[`skus.${index}.price`]}>
            <Input
              aria-label={`价格 ${index + 1}`}
              type='number'
              min={0}
              step='0.01'
              value={row.price}
              disabled={disabled}
              onChange={event => updateRow(index, { price: event.target.value })}
            />
          </Field>

          <Field label='库存' error={errors[`skus.${index}.stock`]}>
            <Input
              aria-label={`库存 ${index + 1}`}
              type='number'
              min={0}
              step='1'
              value={row.stock}
              disabled={disabled}
              onChange={event => updateRow(index, { stock: event.target.value })}
            />
          </Field>

          <Field label='状态'>
            <Select
              aria-label={`SKU 状态 ${index + 1}`}
              options={STATUS_OPTIONS}
              value={row.status}
              disabled={disabled}
              onChange={nextValue => updateRow(index, { status: nextValue === 'DISABLED' ? 'DISABLED' : 'ACTIVE' })}
            />
          </Field>

          <Button
            variant='ghost'
            size='sm'
            aria-label={`删除 SKU ${index + 1}`}
            disabled={disabled || value.length <= 1}
            onClick={() => removeRow(index)}
          >
            删除
          </Button>
        </div>
      ))}

      <div>
        <Button variant='secondary' size='sm' disabled={disabled} onClick={addRow}>
          新增 SKU
        </Button>
      </div>
    </div>
  );
}

export default SkuEditor;
