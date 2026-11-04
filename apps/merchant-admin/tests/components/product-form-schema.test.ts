import type { CategoryAttributeDTO } from '@mtm/contracts';
import { createTranslator, type Translate } from '@mtm/i18n';
import { expect, test } from 'vitest';

import { createProductFormSchema } from '@/components/product/ProductForm/schema';
import type { ProductFormValues } from '@/components/product/ProductForm/schema';

const zh = createTranslator('zh-CN');
const en = createTranslator('en-US');

const NUMBER_ATTRIBUTE: CategoryAttributeDTO = {
  id: 'attr-number',
  name: '重量',
  type: 'NUMBER',
  required: false,
  options: [],
  sort: 0,
};

const SELECT_ATTRIBUTE: CategoryAttributeDTO = {
  id: 'attr-select',
  name: '材质',
  type: 'SELECT',
  required: true,
  options: ['棉麻', '实木'],
  sort: 0,
};

function values(patch: Partial<ProductFormValues> = {}): ProductFormValues {
  return {
    shopId: 'shop-demo-1',
    code: 'P1',
    categoryId: 'category-demo-home-sofa',
    brandId: '',
    title: '测试沙发',
    subtitle: '',
    images: ['data:image/svg+xml;utf8,<svg/>'],
    description: '描述',
    attributes: {},
    skus: [{ skuCode: 'P1', specsText: '三人位', price: '2599', stock: '10', status: 'ACTIVE' }],
    ...patch,
  };
}

function validate(attributes: CategoryAttributeDTO[], patch: Partial<ProductFormValues> = {}, t: Translate = zh) {
  return createProductFormSchema('edit', () => attributes, t).safeParse(values(patch));
}

test('NUMBER 属性填写非数字时立即报错', () => {
  const result = validate([NUMBER_ATTRIBUTE], { attributes: { 'attr-number': 'abc' } });

  expect(result.success).toBe(false);
  expect(result.error?.issues.some(issue => issue.path.join('.') === 'attributes.attr-number')).toBe(true);
});

test('NUMBER 属性填写有限数字时通过', () => {
  const result = validate([NUMBER_ATTRIBUTE], { attributes: { 'attr-number': '12.5' } });

  expect(result.success).toBe(true);
});

test('必填 SELECT 属性为空或选项无效时报错', () => {
  const emptyResult = validate([SELECT_ATTRIBUTE], { attributes: {} });
  const invalidResult = validate([SELECT_ATTRIBUTE], { attributes: { 'attr-select': '金属' } });

  expect(emptyResult.success).toBe(false);
  expect(invalidResult.success).toBe(false);
  expect(invalidResult.error?.issues.some(issue => issue.path.join('.') === 'attributes.attr-select')).toBe(true);
});

test('可选属性值为 undefined 时通过，解析结果丢弃该键', () => {
  const result = validate([NUMBER_ATTRIBUTE], {
    attributes: { 'attr-number': undefined } as unknown as Record<string, string>,
  });

  expect(result.success).toBe(true);

  if (result.success) {
    expect(result.data.attributes).toEqual({});
    expect('attr-number' in result.data.attributes).toBe(false);
  }
});

test('必填属性值为 undefined 时返回翻译后的必填错误', () => {
  const result = validate([SELECT_ATTRIBUTE], {
    attributes: { 'attr-select': undefined } as unknown as Record<string, string>,
  });

  expect(result.success).toBe(false);
  expect(
    result.error?.issues.some(
      issue => issue.path.join('.') === 'attributes.attr-select' && issue.message === '请填写该属性'
    )
  ).toBe(true);
  expect(result.error?.issues.some(issue => /expected string/.test(issue.message))).toBe(false);
});

test('全部 SKU 行为空时报错交给表单拦截', () => {
  const result = validate([], { skus: [{ skuCode: '', specsText: '', price: '', stock: '', status: 'ACTIVE' }] });

  expect(result.success).toBe(false);
  expect(result.error?.issues.some(issue => issue.message === '至少填写一个 SKU')).toBe(true);
});

test('重复 SKU 编码与非法价格被拦截', () => {
  const result = validate([], {
    skus: [
      { skuCode: 'P1', specsText: '', price: '-1', stock: '1', status: 'ACTIVE' },
      { skuCode: 'p1', specsText: '', price: '10', stock: '1', status: 'ACTIVE' },
    ],
  });

  expect(result.success).toBe(false);
  expect(result.error?.issues.some(issue => issue.message === 'SKU 编码重复')).toBe(true);
  expect(result.error?.issues.some(issue => issue.message === '请填写有效价格')).toBe(true);
});

test('en-US 下必填字段返回英文错误', () => {
  const result = validate([], { title: '' }, en);

  expect(result.success).toBe(false);
  expect(result.error?.issues.some(issue => issue.message === 'Product title is required.')).toBe(true);
});
