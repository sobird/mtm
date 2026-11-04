'use client';

import type { CategoryAttributeDTO } from '@mtm/contracts';

import { Field, Input, Select } from '@/components/ui';

export interface AttributeFieldsProps {
  attributes: CategoryAttributeDTO[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
}

/** 根据类目属性定义渲染商品属性输入，值以属性 ID 为键。 */
export function AttributeFields({ attributes, values, onChange, disabled = false, errors = {} }: AttributeFieldsProps) {
  if (attributes.length === 0) {
    return <p style={{ color: 'var(--color-text-secondary)' }}>该商品类目暂无属性。</p>;
  }

  const updateValue = (attributeId: string, nextValue: string) => {
    onChange({ ...values, [attributeId]: nextValue });
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {attributes.map(attribute => {
        const fieldError = errors[`attributes.${attribute.id}`];
        const value = values[attribute.id] ?? '';

        if (attribute.type === 'SELECT') {
          return (
            <Field key={attribute.id} label={attribute.name} required={attribute.required} error={fieldError}>
              <Select
                aria-label={attribute.name}
                placeholder='请选择'
                options={attribute.options.map(option => ({ value: option, label: option }))}
                value={value}
                onChange={nextValue => updateValue(attribute.id, String(nextValue))}
                disabled={disabled}
              />
            </Field>
          );
        }

        return (
          <Field key={attribute.id} label={attribute.name} required={attribute.required} error={fieldError}>
            <Input
              aria-label={attribute.name}
              type={attribute.type === 'NUMBER' ? 'number' : 'text'}
              value={value}
              onChange={event => updateValue(attribute.id, event.target.value)}
              disabled={disabled}
            />
          </Field>
        );
      })}
    </div>
  );
}

export default AttributeFields;
