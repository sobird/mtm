import { describe, expect, test } from 'vitest';

import {
  DEMO_MERCHANT_ID,
  UPLOAD_ALLOWED_MIME_TYPES,
  UPLOAD_MAX_BYTES,
  apiErrorSchema,
  brandCreateSchema,
  brandSchema,
  brandUpdateSchema,
  categoryCreateSchema,
  categoryNodeSchema,
  categoryUpdateSchema,
  idSchema,
  merchantDetailSchema,
  merchantUpdateSchema,
  pageSchema,
  paginationQuerySchema,
  shopUpdateSchema,
  uploadResultSchema,
} from '../src';

describe('pagination', () => {
  test('分页参数默认 1 / 20 并把字符串转成数字', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(paginationQuerySchema.parse({ page: '2', pageSize: '50' })).toEqual({ page: 2, pageSize: 50 });
    expect(paginationQuerySchema.safeParse({ pageSize: '101' }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ page: '0' }).success).toBe(false);
  });

  test('分页响应包络是 { data, meta }', () => {
    const schema = pageSchema(brandSchema);
    const parsed = schema.parse({
      data: [{ id: 'brand-demo-1', name: '青禾', logoUrl: null, status: 'ACTIVE' }],
      meta: { page: 1, pageSize: 20, total: 1 },
    });
    expect(parsed.data).toHaveLength(1);
    expect(parsed.meta.total).toBe(1);
  });
});

describe('category', () => {
  test('类目 SELECT 属性必须提供非空选项', () => {
    expect(categoryCreateSchema.safeParse({ name: '家具' }).success).toBe(true);
    expect(
      categoryCreateSchema.safeParse({
        name: '沙发',
        attributes: [{ name: '材质', type: 'SELECT', options: [] }],
      }).success
    ).toBe(false);
    expect(
      categoryCreateSchema.safeParse({
        name: '沙发',
        attributes: [{ name: '材质', type: 'SELECT', options: ['布艺', '真皮'] }],
      }).success
    ).toBe(true);
  });

  test('创建类目填写默认值且不接收服务端计算字段', () => {
    const parsed = categoryCreateSchema.parse({ name: ' 家具 ', level: 9, path: '/evil' });
    expect(parsed).toEqual({ name: '家具', sort: 0, status: 'ACTIVE', attributes: [] });
  });

  test('更新类目不接受 parentId', () => {
    expect(categoryUpdateSchema.parse({ parentId: 'other', name: '新名字' })).toEqual({ name: '新名字' });
  });

  test('类目节点是扁平结构且校验 ID 格式', () => {
    const node = {
      id: 'category-demo-1',
      parentId: null,
      name: '家居生活',
      level: 1,
      path: '/category-demo-1',
      sort: 0,
      status: 'ACTIVE',
      attributes: [{ id: 'attr-1', name: '材质', type: 'SELECT', required: false, options: ['布艺'], sort: 0 }],
    };
    expect(categoryNodeSchema.safeParse(node).success).toBe(true);
    expect(categoryNodeSchema.safeParse({ ...node, level: 4 }).success).toBe(false);
    expect(idSchema.safeParse('../etc/passwd').success).toBe(false);
  });

  test('类目属性输出包含 ID，输入 ID 可选', () => {
    expect(
      categoryCreateSchema.safeParse({
        name: '沙发',
        attributes: [{ id: 'attr-1', name: '材质', type: 'SELECT', options: ['棉麻'] }],
      }).success
    ).toBe(true);
    expect(
      categoryNodeSchema.safeParse({
        id: 'category-demo-1',
        parentId: null,
        name: '家居生活',
        level: 1,
        path: '/category-demo-1',
        sort: 0,
        status: 'ACTIVE',
        attributes: [{ id: 'attr-1', name: '材质', type: 'SELECT', required: false, options: ['棉麻'], sort: 0 }],
      }).success
    ).toBe(true);
    expect(
      categoryNodeSchema.safeParse({
        id: 'category-demo-1',
        parentId: null,
        name: '家居生活',
        level: 1,
        path: '/category-demo-1',
        sort: 0,
        status: 'ACTIVE',
        attributes: [{ name: '材质', type: 'SELECT', required: false, options: ['棉麻'], sort: 0 }],
      }).success
    ).toBe(false);
  });
});

describe('brand', () => {
  test('品牌名称去空格并拒绝空名', () => {
    expect(brandCreateSchema.parse({ name: ' 青禾 ' }).name).toBe('青禾');
    expect(brandCreateSchema.safeParse({ name: '   ' }).success).toBe(false);
  });

  test('品牌创建默认启用且 logo 可为空', () => {
    expect(brandCreateSchema.parse({ name: '青禾' })).toEqual({ name: '青禾', status: 'ACTIVE' });
    expect(brandCreateSchema.parse({ name: '青禾', logoUrl: null }).logoUrl).toBeNull();
  });

  test('品牌更新为局部输入', () => {
    expect(brandUpdateSchema.parse({ status: 'DISABLED' })).toEqual({ status: 'DISABLED' });
  });
});

describe('merchant and shop', () => {
  test('商家自维护输入会剥掉 tenant 字段', () => {
    expect(merchantUpdateSchema.parse({ name: '新名称', merchantId: 'evil' })).toEqual({ name: '新名称' });
  });

  test('店铺自维护输入剥掉 id / merchantId 并允许空字符串', () => {
    expect(shopUpdateSchema.parse({ id: 'x', merchantId: 'y', externalLink: '', description: ' 新简介 ' })).toEqual({
      externalLink: '',
      description: '新简介',
    });
  });

  test('商家详情包含店铺列表', () => {
    const detail = {
      id: DEMO_MERCHANT_ID,
      code: 'M1001',
      name: '青禾家居有限公司',
      status: 'ACTIVE',
      contactName: '林青',
      contactPhone: '13800000001',
      createdAt: '2026-11-04T00:00:00.000Z',
      updatedAt: '2026-11-04T00:00:00.000Z',
      shops: [
        {
          id: 'shop-demo-1',
          merchantId: DEMO_MERCHANT_ID,
          name: '青禾家居旗舰店',
          logoUrl: null,
          status: 'ACTIVE',
          description: null,
          externalLink: null,
          address: null,
          contactName: null,
          contactPhone: null,
          createdAt: '2026-11-04T00:00:00.000Z',
        },
      ],
    };
    expect(merchantDetailSchema.safeParse(detail).success).toBe(true);
    expect(merchantDetailSchema.safeParse({ ...detail, shops: 'not-an-array' }).success).toBe(false);
  });
});

describe('upload and demo identity', () => {
  test('上传结果与限制常量', () => {
    expect(UPLOAD_ALLOWED_MIME_TYPES).toEqual(['image/png', 'image/jpeg', 'image/webp']);
    expect(UPLOAD_MAX_BYTES).toBe(10 * 1024 * 1024);
    expect(uploadResultSchema.parse({ id: 'media-1', url: 'http://localhost:4000/uploads/x.png' })).toEqual({
      id: 'media-1',
      url: 'http://localhost:4000/uploads/x.png',
    });
  });

  test('演示商家 ID 固定为 merchant-demo-1', () => {
    expect(DEMO_MERCHANT_ID).toBe('merchant-demo-1');
  });

  test('错误包络包含 code / message / details', () => {
    expect(apiErrorSchema.parse({ error: { code: 'NOT_FOUND', message: '不存在', details: null } })).toEqual({
      error: { code: 'NOT_FOUND', message: '不存在', details: null },
    });
  });
});
