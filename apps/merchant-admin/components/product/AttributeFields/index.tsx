'use client';

import type { CategoryAttributeDTO } from '@mtm/contracts';
import { useTranslations } from 'next-intl';
import { Controller, useFormContext } from 'react-hook-form';
import type { Path } from 'react-hook-form';

import { Field, Input, Select } from '@/components/ui';

import type { ProductFormValues } from '../ProductForm/schema';

export interface AttributeFieldsProps {
  attributes: CategoryAttributeDTO[];
  disabled?: boolean;
}

/** 根据类目属性定义渲染商品属性输入，值以属性 ID 为键注册到表单。 */
export function AttributeFields({ attributes, disabled = false }: AttributeFieldsProps) {
  const t = useTranslations('product.attribute');
  const { control } = useFormContext<ProductFormValues>();

  if (attributes.length === 0) {
    return <p style={{ color: 'var(--color-text-secondary)' }}>{t('empty')}</p>;
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {attributes.map(attribute => (
        <Controller
          key={attribute.id}
          control={control}
          name={`attributes.${attribute.id}` as Path<ProductFormValues>}
          render={({ field, fieldState }) => {
            const value = (field.value as string | undefined) ?? '';

            return (
              <Field
                label={attribute.name}
                required={attribute.required}
                error={fieldState.error?.message as string | undefined}
              >
                {attribute.type === 'SELECT' ? (
                  <Select
                    aria-label={attribute.name}
                    data-testid={`attribute-${attribute.id}`}
                    placeholder={t('selectPlaceholder')}
                    options={attribute.options.map(option => ({ value: option, label: option }))}
                    value={value}
                    onChange={nextValue => field.onChange(String(nextValue))}
                    disabled={disabled}
                  />
                ) : (
                  <Input
                    aria-label={attribute.name}
                    data-testid={`attribute-${attribute.id}`}
                    type={attribute.type === 'NUMBER' ? 'number' : 'text'}
                    value={value}
                    onChange={event => field.onChange(event.target.value)}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    disabled={disabled}
                  />
                )}
              </Field>
            );
          }}
        />
      ))}
    </div>
  );
}

export default AttributeFields;
