import { expect, test } from 'vitest';

import { buildCreateInput, buildVersionInput } from '@/components/product/ProductForm/payload';

const STATE = {
  categoryId: 'category-demo-home-sofa',
  brandId: '',
  title: ' 测试沙发 ',
  subtitle: '',
  images: ['data:image/svg+xml;utf8,<svg/>'],
  description: ' 描述 ',
  attributes: { 'attr-demo-home-sofa-material': '棉麻' },
  skus: [{ skuCode: 'P1', specsText: '三人位', price: '2599', stock: '10', status: 'ACTIVE' as const }],
};

test('表单状态转换为版本输入', () => {
  expect(buildVersionInput(STATE)).toEqual({
    categoryId: 'category-demo-home-sofa',
    brandId: null,
    title: '测试沙发',
    subtitle: null,
    images: ['data:image/svg+xml;utf8,<svg/>'],
    description: '描述',
    attributes: { 'attr-demo-home-sofa-material': '棉麻' },
    skus: [{ skuCode: 'P1', specs: { 规格: '三人位' }, price: 2599, stock: 10, status: 'ACTIVE' }],
  });
});

test('创建输入附加 shopId 与 code，并过滤空 SKU 行', () => {
  expect(
    buildCreateInput(
      { ...STATE, skus: [...STATE.skus, { skuCode: '', specsText: '', price: '0', stock: '0', status: 'ACTIVE' }] },
      'shop-demo-1',
      ' P1001 '
    )
  ).toMatchObject({ shopId: 'shop-demo-1', code: 'P1001', skus: [{ skuCode: 'P1' }] });
});

test('全部 SKU 行为空时返回空数组，交给表单校验拦截', () => {
  const result = buildVersionInput({
    ...STATE,
    skus: [{ skuCode: '', specsText: '', price: '', stock: '', status: 'ACTIVE' }],
  });

  expect(result.skus).toEqual([]);
});
