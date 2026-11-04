import { DEMO_MERCHANT_ID } from '@mtm/contracts';
import { beforeEach, expect, test } from 'vitest';

import { seedCoreData } from '@/prisma/seed-data';
import { createApp } from '@/src/app';
import { prisma } from '@/src/db';

import { merchantToken, opsToken, resetCoreFixtures } from './helpers';

beforeEach(async () => {
  await resetCoreFixtures();
  await seedCoreData(prisma);
});

const CREATE_BODY = {
  shopId: 'shop-demo-1',
  code: 'TEST-P1',
  categoryId: 'category-demo-home-sofa',
  brandId: 'brand-demo-1',
  title: '测试沙发',
  subtitle: null,
  images: ['data:image/svg+xml;utf8,<svg/>'],
  description: '测试描述',
  attributes: { 'attr-demo-home-sofa-material': '棉麻' },
  skus: [{ skuCode: 'TEST-P1-1', specs: { 规格: '三人位' }, price: 2599, stock: 10 }],
};

async function request(path: string, method: string, body: unknown, token: Promise<string>) {
  const headers: Record<string, string> = { authorization: `Bearer ${await token}` };
  if (body !== undefined) headers['content-type'] = 'application/json';
  return createApp().request(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function get(path: string, token: Promise<string>) {
  return request(path, 'GET', undefined, token);
}

test('商家创建商品生成 DRAFT v1 并回传类目/品牌/店铺名称', async () => {
  const res = await request(
    '/api/v1/products',
    'POST',
    CREATE_BODY,
    merchantToken(DEMO_MERCHANT_ID, ['product:create'])
  );

  expect(res.status).toBe(200);
  const detail = (await res.json()).data;
  expect(detail).toMatchObject({
    code: 'TEST-P1',
    title: '测试沙发',
    status: 'DRAFT',
    version: 1,
    merchantName: '青禾家居有限公司',
    shopName: '青禾家居旗舰店',
    categoryName: '沙发',
    brandName: '青禾',
  });
  expect(detail.currentVersion.mainImageUrl).toBe(CREATE_BODY.images[0]);
  expect(detail.currentVersion.skus[0]).toMatchObject({ price: '2599.00', stock: 10 });
});

test('重复商品编码返回 409', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create']);
  expect((await request('/api/v1/products', 'POST', CREATE_BODY, token)).status).toBe(200);
  const duplicate = await request('/api/v1/products', 'POST', { ...CREATE_BODY }, token);
  expect(duplicate.status).toBe(409);
  expect(await duplicate.json()).toMatchObject({ error: { code: 'PRODUCT_CODE_EXISTS' } });
});

test('类目属性缺失必填项或选项非法返回 400', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create']);

  const missing = await request('/api/v1/products', 'POST', { ...CREATE_BODY, code: 'TEST-P2', attributes: {} }, token);
  expect(missing.status).toBe(400);
  expect(await missing.json()).toMatchObject({ error: { code: 'PRODUCT_ATTRIBUTE_REQUIRED' } });

  const illegal = await request(
    '/api/v1/products',
    'POST',
    { ...CREATE_BODY, code: 'TEST-P3', attributes: { 'attr-demo-home-sofa-material': '石头' } },
    token
  );
  expect(illegal.status).toBe(400);
  expect(await illegal.json()).toMatchObject({ error: { code: 'PRODUCT_ATTRIBUTE_INVALID' } });
});

test('商家列表只返回本商家商品，运营只看到已提交/已通过/已发布', async () => {
  const merchantTokenValue = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:view']);
  const created = await request('/api/v1/products', 'POST', CREATE_BODY, merchantTokenValue);
  const createdDetail = (await created.json()).data;
  const productId = createdDetail.id;

  const merchantList = await get('/api/v1/products', merchantTokenValue);
  expect(merchantList.status).toBe(200);
  const merchantBody = await merchantList.json();
  expect(merchantBody.meta.total).toBe(1);
  expect(merchantBody.data[0].id).toBe(productId);

  const opsList = await get('/api/v1/products', opsToken(['product:view']));
  const opsBody = await opsList.json();
  expect(opsBody.data.some((row: { id: string }) => row.id === productId)).toBe(false);

  await prisma.productVersion.update({
    where: { id: createdDetail.currentVersionId },
    data: { status: 'SUBMITTED' },
  });
  const visible = await get('/api/v1/products', opsToken(['product:view']));
  expect((await visible.json()).data.some((row: { id: string }) => row.id === productId)).toBe(true);
});

test('跨租户读取返回 404，运营范围外返回 403', async () => {
  const created = await request(
    '/api/v1/products',
    'POST',
    CREATE_BODY,
    merchantToken(DEMO_MERCHANT_ID, ['product:create'])
  );
  const productId = (await created.json()).data.id;

  expect((await get(`/api/v1/products/${productId}`, merchantToken('merchant-demo-2', ['product:view']))).status).toBe(
    404
  );

  await prisma.productVersion.updateMany({ where: { productId }, data: { status: 'SUBMITTED' } });
  expect((await get(`/api/v1/products/${productId}`, opsToken(['product:view'], ['merchant-demo-2']))).status).toBe(
    403
  );
});

test('运营状态过滤作用于当前版本且分页 meta 正确', async () => {
  const merchantTokenValue = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:view']);

  const createdDetails = await Promise.all(
    ['TEST-F1', 'TEST-F2'].map(async code => {
      const created = await request('/api/v1/products', 'POST', { ...CREATE_BODY, code }, merchantTokenValue);
      return (await created.json()).data;
    })
  );

  await prisma.productVersion.updateMany({
    where: { id: { in: createdDetails.map((detail: { currentVersionId: string }) => detail.currentVersionId) } },
    data: { status: 'SUBMITTED' },
  });

  const res = await get('/api/v1/products?status=SUBMITTED&page=1&pageSize=1', opsToken(['product:view']));
  const body = await res.json();
  expect(body.data).toHaveLength(1);
  expect(body.meta).toEqual({ page: 1, pageSize: 1, total: 2 });
});
