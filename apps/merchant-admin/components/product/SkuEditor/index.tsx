'use client';

import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button, Field, Input, Select } from '@/components/ui';

import type { ProductFormValues, SkuFormRow } from '../ProductForm/schema';

export type { SkuFormRow };

export interface SkuEditorProps {
  disabled?: boolean;
}

/** 空 SKU 行；至少保留一行供用户填写。 */
export function createEmptySku(): SkuFormRow {
  return { skuCode: '', specsText: '', price: '', stock: '', status: 'ACTIVE' };
}

/** 商品 SKU 行编辑，基于 `useFieldArray` 获得稳定行 key。 */
export function SkuEditor({ disabled = false }: SkuEditorProps) {
  const t = useTranslations('product.sku');
  const tCommon = useTranslations('common');
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'skus' });

  const statusOptions = [
    { value: 'ACTIVE', label: t('statusActive') },
    { value: 'DISABLED', label: t('statusDisabled') },
  ];

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
          <Field label={t('code', { index: index + 1 })}>
            <Input
              name={`skus.${index}.skuCode`}
              aria-label={t('code', { index: index + 1 })}
              data-testid={index === 0 ? 'product-sku-code' : undefined}
              maxLength={50}
              disabled={disabled}
            />
          </Field>

          <Field label={t('specs')}>
            <Input
              name={`skus.${index}.specsText`}
              aria-label={t('specsLabel', { index: index + 1 })}
              maxLength={50}
              disabled={disabled}
            />
          </Field>

          <Field label={t('price')}>
            <Input
              name={`skus.${index}.price`}
              aria-label={t('priceLabel', { index: index + 1 })}
              type='number'
              min={0}
              step='0.01'
              disabled={disabled}
            />
          </Field>

          <Field label={t('stock')}>
            <Input
              name={`skus.${index}.stock`}
              aria-label={t('stockLabel', { index: index + 1 })}
              type='number'
              min={0}
              step='1'
              disabled={disabled}
            />
          </Field>

          <Field label={t('status')}>
            <Select
              name={`skus.${index}.status`}
              aria-label={t('statusLabel', { index: index + 1 })}
              options={statusOptions}
              disabled={disabled}
            />
          </Field>

          <Button
            variant='ghost'
            size='sm'
            aria-label={t('deleteLabel', { index: index + 1 })}
            disabled={disabled || fields.length <= 1}
            onClick={() => remove(index)}
          >
            {tCommon('delete')}
          </Button>
        </div>
      ))}

      <div>
        <Button variant='secondary' size='sm' disabled={disabled} onClick={() => append(createEmptySku())}>
          {t('add')}
        </Button>
      </div>
    </div>
  );
}

export default SkuEditor;
