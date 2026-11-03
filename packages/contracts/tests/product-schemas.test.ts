import { describe, expect, test } from 'vitest';

import {
  auditRejectSchema,
  productCreateSchema,
  productDetailSchema,
  productQuerySchema,
  productVersionInputSchema,
} from '../src';

const VERSION_INPUT = {
  categoryId: 'category-demo-home-sofa',
  brandId: 'brand-demo-1',
  title: ' 北欧三人位布艺沙发 ',
  subtitle: null,
  images: ['data:image/svg+xml;utf8,<svg/>'],
  description: '  舒适耐用的三人位沙发  ',
  attributes: { 'attr-demo-home-sofa-material': '棉麻' },
  skus: [{ skuCode: 'P1001-1', specs: { 规格: '三人位' }, price: 2599, stock: 12 }],
};

describe('product', () => {
  test('创建输入去空格、补齐 SKU 默认值且不接收 mainImageUrl', () => {
    const parsed = productCreateSchema.parse({
      ...VERSION_INPUT,
      shopId: 'shop-demo-1',
      code: ' P1001 ',
      mainImageUrl: '/evil.png',
    });

    expect(parsed.title).toBe('北欧三人位布艺沙发');
    expect(parsed.code).toBe('P1001');
    expect(parsed.skus[0]).toEqual({
      skuCode: 'P1001-1',
      specs: { 规格: '三人位' },
      price: 2599,
      stock: 12,
      status: 'ACTIVE',
    });
    expect(parsed).not.toHaveProperty('mainImageUrl');
  });

  test('图片至少一张、SKU 至少一个、价格为非负数', () => {
    const base = { ...VERSION_INPUT, shopId: 'shop-demo-1', code: 'P1001' };
    expect(productCreateSchema.safeParse({ ...base, images: [] }).success).toBe(false);
    expect(productCreateSchema.safeParse({ ...base, skus: [] }).success).toBe(false);
    expect(productCreateSchema.safeParse({ ...base, skus: [{ skuCode: 'a', price: -1, stock: 0 }] }).success).toBe(
      false
    );
  });

  test('更新输入与版本输入同构，不含 shopId / code', () => {
    expect(productVersionInputSchema.parse(VERSION_INPUT).brandId).toBe('brand-demo-1');
    expect(productVersionInputSchema.safeParse({ ...VERSION_INPUT, shopId: 'x' }).success).toBe(true);
    expect(Object.keys(productVersionInputSchema.parse({ ...VERSION_INPUT, code: 'x' }))).not.toContain('code');
  });

  test('列表查询默认分页并只接受已知状态', () => {
    expect(productQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(productQuerySchema.safeParse({ status: 'PUBLISHED' }).success).toBe(true);
    expect(productQuerySchema.safeParse({ status: 'UNKNOWN' }).success).toBe(false);
  });

  test('详情包含当前版本、线上版本与版本历史', () => {
    const detail = {
      id: 'product-demo-1',
      code: 'P1001',
      title: '北欧三人位布艺沙发',
      mainImageUrl: '/uploads/sofa.png',
      categoryId: 'category-demo-home-sofa',
      categoryName: '沙发',
      brandId: 'brand-demo-1',
      brandName: '青禾',
      shopId: 'shop-demo-1',
      shopName: '青禾家居旗舰店',
      merchantId: 'merchant-demo-1',
      merchantName: '青禾家居有限公司',
      status: 'PUBLISHED',
      version: 1,
      currentVersionId: 'pv-1',
      publishedVersionId: 'pv-1',
      updatedAt: '2026-11-04T00:00:00.000Z',
      currentVersion: {
        id: 'pv-1',
        version: 1,
        status: 'PUBLISHED',
        title: '北欧三人位布艺沙发',
        subtitle: null,
        mainImageUrl: '/uploads/sofa.png',
        images: ['/uploads/sofa.png'],
        description: '描述',
        attributes: { 'attr-demo-home-sofa-material': '棉麻' },
        createdBy: 'account-1',
        createdAt: '2026-11-04T00:00:00.000Z',
        submittedAt: '2026-11-04T00:00:00.000Z',
        reviewedAt: '2026-11-04T00:00:00.000Z',
        publishedAt: '2026-11-04T00:00:00.000Z',
        skus: [
          {
            id: 'sku-1',
            skuCode: 'P1001-1',
            specs: { 规格: '三人位' },
            price: '2599.00',
            stock: 12,
            status: 'ACTIVE',
          },
        ],
      },
      publishedVersion: null,
      versions: [
        {
          id: 'pv-1',
          version: 1,
          status: 'PUBLISHED',
          title: '北欧三人位布艺沙发',
          createdAt: '2026-11-04T00:00:00.000Z',
          submittedAt: '2026-11-04T00:00:00.000Z',
          reviewedAt: '2026-11-04T00:00:00.000Z',
          publishedAt: '2026-11-04T00:00:00.000Z',
        },
      ],
    };
    expect(productDetailSchema.safeParse(detail).success).toBe(true);
    expect(productDetailSchema.safeParse({ ...detail, currentVersion: null }).success).toBe(false);
  });
});

describe('audit', () => {
  test('驳回必须填写原因，通过可不填', () => {
    expect(auditRejectSchema.safeParse({ comment: '图片不清晰' }).success).toBe(true);
    expect(auditRejectSchema.safeParse({ comment: '  ' }).success).toBe(false);
  });
});
