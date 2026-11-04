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

  // 种子演示商品也在本商家下，用商品编码关键字限定断言范围，保持精确计数。
  const merchantList = await get('/api/v1/products?keyword=TEST-P1', merchantTokenValue);
  expect(merchantList.status).toBe(200);
  const merchantBody = await merchantList.json();
  expect(merchantBody.meta.total).toBe(1);
  expect(merchantBody.data[0].id).toBe(productId);

  const opsList = await get('/api/v1/products?keyword=TEST-P1', opsToken(['product:view']));
  const opsBody = await opsList.json();
  expect(opsBody.data.some((row: { id: string }) => row.id === productId)).toBe(false);

  await prisma.productVersion.update({
    where: { id: createdDetail.currentVersionId },
    data: { status: 'SUBMITTED' },
  });
  const visible = await get('/api/v1/products?keyword=TEST-P1', opsToken(['product:view']));
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

test('详情可见性：运营不可见 DRAFT，提交后可见；商家可见自己的 DRAFT', async () => {
  const merchantTokenValue = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:view']);
  const created = await request('/api/v1/products', 'POST', CREATE_BODY, merchantTokenValue);
  const detail = (await created.json()).data;
  const productId = detail.id;

  const draftAsMerchant = await get(`/api/v1/products/${productId}`, merchantTokenValue);
  expect(draftAsMerchant.status).toBe(200);
  expect((await draftAsMerchant.json()).data.id).toBe(productId);

  expect((await get(`/api/v1/products/${productId}`, opsToken(['product:view']))).status).toBe(404);

  await prisma.productVersion.update({
    where: { id: detail.currentVersionId },
    data: { status: 'SUBMITTED' },
  });

  const submittedAsOps = await get(`/api/v1/products/${productId}`, opsToken(['product:view']));
  expect(submittedAsOps.status).toBe(200);
  expect((await submittedAsOps.json()).data.id).toBe(productId);
});

test('草稿就地更新，版本号不变', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:update', 'product:view']);
  const created = await request('/api/v1/products', 'POST', CREATE_BODY, token);
  const detail = (await created.json()).data;

  // 创建时使用 SKU A，PATCH 时提交不同的 SKU B，验证草稿原地更新会全量替换 SKU
  const res = await request(
    `/api/v1/products/${detail.id}`,
    'PATCH',
    {
      ...CREATE_BODY,
      title: '改名沙发',
      skus: [{ skuCode: 'TEST-P1-B', specs: { 规格: '四人位' }, price: 3599, stock: 5 }],
    },
    token
  );
  expect(res.status).toBe(200);
  const updated = (await res.json()).data;
  expect(updated.currentVersionId).toBe(detail.currentVersionId);
  expect(updated.version).toBe(1);
  expect(updated.title).toBe('改名沙发');

  const skuCodes = updated.currentVersion.skus.map((sku: { skuCode: string }) => sku.skuCode);
  expect(skuCodes).toEqual(['TEST-P1-B']);
  expect(skuCodes).not.toContain('TEST-P1-1');
});

test('已提交商品编辑返回 409', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:update', 'product:view']);
  const created = await request('/api/v1/products', 'POST', CREATE_BODY, token);
  const detail = (await created.json()).data;
  await prisma.productVersion.update({ where: { id: detail.currentVersionId }, data: { status: 'SUBMITTED' } });

  const res = await request(`/api/v1/products/${detail.id}`, 'PATCH', { ...CREATE_BODY, title: '改名' }, token);
  expect(res.status).toBe(409);
  expect(await res.json()).toMatchObject({ error: { code: 'PRODUCT_IN_REVIEW' } });
});

test('编辑已驳回版本创建 v2 草稿且保留 v1', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:update', 'product:view']);
  const created = await request('/api/v1/products', 'POST', CREATE_BODY, token);
  const detail = (await created.json()).data;
  await prisma.productVersion.update({ where: { id: detail.currentVersionId }, data: { status: 'REJECTED' } });

  const res = await request(`/api/v1/products/${detail.id}`, 'PATCH', { ...CREATE_BODY, title: '第二版沙发' }, token);
  expect(res.status).toBe(200);
  const updated = (await res.json()).data;
  expect(updated.version).toBe(2);
  expect(updated.status).toBe('DRAFT');
  expect(updated.currentVersionId).not.toBe(detail.currentVersionId);

  const v1 = await prisma.productVersion.findUniqueOrThrow({ where: { id: detail.currentVersionId } });
  expect(v1.status).toBe('REJECTED');
  expect(v1.title).toBe('测试沙发');
});

test('跨租户编辑返回 404', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:update', 'product:view']);
  const created = await request('/api/v1/products', 'POST', CREATE_BODY, token);
  const detail = (await created.json()).data;

  const res = await request(
    `/api/v1/products/${detail.id}`,
    'PATCH',
    { ...CREATE_BODY, title: '越权' },
    merchantToken('merchant-demo-2', ['product:update'])
  );
  expect(res.status).toBe(404);
  expect(await res.json()).toMatchObject({ error: { code: 'PRODUCT_NOT_FOUND' } });
});

async function createDraft(token: Promise<string>, code: string) {
  const res = await request('/api/v1/products', 'POST', { ...CREATE_BODY, code }, token);
  return (await res.json()).data;
}

test('提交草稿进入 SUBMITTED 并生成待审核记录', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:submit', 'product:view']);
  const detail = await createDraft(token, 'TEST-S1');

  const res = await request(`/api/v1/products/${detail.id}/submit`, 'POST', undefined, token);
  expect(res.status).toBe(200);
  const submitted = (await res.json()).data;
  expect(submitted.status).toBe('SUBMITTED');
  expect(submitted.currentVersion.submittedAt).not.toBeNull();

  const version = await prisma.productVersion.findUniqueOrThrow({ where: { id: detail.currentVersionId } });
  expect(version.submittedAt).not.toBeNull();

  const audit = await prisma.auditRecord.findFirstOrThrow({ where: { productVersionId: detail.currentVersionId } });
  expect(audit.status).toBe('PENDING');
  expect(audit.submitterId).toBe('merchant-test');
});

test('非草稿再次提交返回 409', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:submit', 'product:view']);
  const detail = await createDraft(token, 'TEST-S2');
  expect((await request(`/api/v1/products/${detail.id}/submit`, 'POST', undefined, token)).status).toBe(200);

  const again = await request(`/api/v1/products/${detail.id}/submit`, 'POST', undefined, token);
  expect(again.status).toBe(409);
  expect(await again.json()).toMatchObject({ error: { code: 'PRODUCT_NOT_DRAFT' } });
});

test('发布已通过版本并把旧线上版本置为 SUPERSEDED', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, [
    'product:create',
    'product:update',
    'product:submit',
    'product:publish',
    'product:view',
  ]);
  const detail = await createDraft(token, 'TEST-PUB');

  // 直接模拟“v1 已发布、v2 已审核通过”。
  const v2 = await prisma.productVersion.create({
    data: {
      productId: detail.id,
      version: 2,
      status: 'APPROVED',
      title: '第二版',
      mainImageUrl: detail.currentVersion.mainImageUrl,
      images: [],
      description: '描述',
      attributes: {},
      createdBy: 'merchant-test',
    },
  });
  await prisma.product.update({
    where: { id: detail.id },
    data: { publishedVersionId: detail.currentVersionId, currentVersionId: v2.id },
  });

  const res = await request(`/api/v1/products/${detail.id}/publish`, 'POST', undefined, token);
  expect(res.status).toBe(200);
  const published = (await res.json()).data;
  expect(published.status).toBe('PUBLISHED');
  expect(published.publishedVersionId).toBe(v2.id);
  expect(published.currentVersionId).toBe(v2.id);
  expect(published.currentVersion.publishedAt).not.toBeNull();

  const old = await prisma.productVersion.findUniqueOrThrow({ where: { id: detail.currentVersionId } });
  expect(old.status).toBe('SUPERSEDED');
});

test('并发发布同一版本仅一次成功，另一次返回 409', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, [
    'product:create',
    'product:update',
    'product:submit',
    'product:publish',
    'product:view',
  ]);
  const detail = await createDraft(token, 'TEST-PUBC');

  const v2 = await prisma.productVersion.create({
    data: {
      productId: detail.id,
      version: 2,
      status: 'APPROVED',
      title: '并发发布版',
      mainImageUrl: detail.currentVersion.mainImageUrl,
      images: [],
      description: '描述',
      attributes: {},
      createdBy: 'merchant-test',
    },
  });
  await prisma.product.update({ where: { id: detail.id }, data: { currentVersionId: v2.id } });

  const [first, second] = await Promise.all([
    request(`/api/v1/products/${detail.id}/publish`, 'POST', undefined, token),
    request(`/api/v1/products/${detail.id}/publish`, 'POST', undefined, token),
  ]);

  expect([first.status, second.status].sort()).toEqual([200, 409]);
  const conflict = first.status === 409 ? first : second;
  expect(await conflict.json()).toMatchObject({ error: { code: 'PRODUCT_NOT_APPROVED' } });

  const product = await prisma.product.findUniqueOrThrow({ where: { id: detail.id } });
  expect(product.publishedVersionId).toBe(v2.id);
  const published = await prisma.productVersion.findUniqueOrThrow({ where: { id: v2.id } });
  expect(published.status).toBe('PUBLISHED');
});

test('未通过审核发布返回 409', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:publish', 'product:view']);
  const detail = await createDraft(token, 'TEST-PUB2');

  const res = await request(`/api/v1/products/${detail.id}/publish`, 'POST', undefined, token);
  expect(res.status).toBe(409);
  expect(await res.json()).toMatchObject({ error: { code: 'PRODUCT_NOT_APPROVED' } });
});

test('下线已发布商品后清空线上版本', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:publish', 'product:view']);
  const detail = await createDraft(token, 'TEST-OFF');
  await prisma.productVersion.update({ where: { id: detail.currentVersionId }, data: { status: 'PUBLISHED' } });
  await prisma.product.update({ where: { id: detail.id }, data: { publishedVersionId: detail.currentVersionId } });

  const res = await request(`/api/v1/products/${detail.id}/offline`, 'POST', undefined, token);
  expect(res.status).toBe(200);
  expect((await res.json()).data.publishedVersionId).toBeNull();

  const version = await prisma.productVersion.findUniqueOrThrow({ where: { id: detail.currentVersionId } });
  expect(version.status).toBe('OFFLINE');
});

test('未发布商品下线返回 409', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:publish', 'product:view']);
  const detail = await createDraft(token, 'TEST-OFF2');

  const res = await request(`/api/v1/products/${detail.id}/offline`, 'POST', undefined, token);
  expect(res.status).toBe(409);
  expect(await res.json()).toMatchObject({ error: { code: 'PRODUCT_NOT_PUBLISHED' } });
});

test('软删除后列表隐藏且详情、编辑、提交均 404', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, [
    'product:create',
    'product:update',
    'product:submit',
    'product:delete',
    'product:view',
  ]);
  const detail = await createDraft(token, 'TEST-DEL');

  expect((await request(`/api/v1/products/${detail.id}`, 'DELETE', undefined, token)).status).toBe(200);

  const list = await get('/api/v1/products?keyword=TEST-DEL', token);
  const body = await list.json();
  expect(body.data.some((row: { id: string }) => row.id === detail.id)).toBe(false);
  expect(body.meta.total).toBe(0);

  const responses = [
    await get(`/api/v1/products/${detail.id}`, token),
    await request(`/api/v1/products/${detail.id}`, 'PATCH', { ...CREATE_BODY, title: '删除后改名' }, token),
    await request(`/api/v1/products/${detail.id}/submit`, 'POST', undefined, token),
  ];

  const results = await Promise.all(responses.map(async res => ({ status: res.status, body: await res.json() })));

  for (const result of results) {
    expect(result.status).toBe(404);
    expect(result.body).toMatchObject({ error: { code: 'PRODUCT_NOT_FOUND' } });
  }
});

test('已提交或已发布商品不可删除，下线后可删除', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:delete', 'product:view']);
  const submitted = await createDraft(token, 'TEST-D1');
  await prisma.productVersion.update({ where: { id: submitted.currentVersionId }, data: { status: 'SUBMITTED' } });
  const blocked = await request(`/api/v1/products/${submitted.id}`, 'DELETE', undefined, token);
  expect(blocked.status).toBe(409);
  expect(await blocked.json()).toMatchObject({ error: { code: 'PRODUCT_IN_REVIEW' } });

  const published = await createDraft(token, 'TEST-D2');
  await prisma.productVersion.update({
    where: { id: published.currentVersionId },
    data: { status: 'PUBLISHED' },
  });
  await prisma.product.update({
    where: { id: published.id },
    data: { publishedVersionId: published.currentVersionId },
  });
  const publishedBlocked = await request(`/api/v1/products/${published.id}`, 'DELETE', undefined, token);
  expect(publishedBlocked.status).toBe(409);
  expect(await publishedBlocked.json()).toMatchObject({ error: { code: 'PRODUCT_PUBLISHED' } });

  const draft = await createDraft(token, 'TEST-D3');
  expect((await request(`/api/v1/products/${draft.id}`, 'DELETE', undefined, token)).status).toBe(200);
  expect(await prisma.product.findUniqueOrThrow({ where: { id: draft.id } })).toMatchObject({
    deletedAt: expect.any(Date),
  });
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

  // keyword 限定到本用例创建的两条商品，避免种子 SUBMITTED 商品计入 total。
  const res = await get(
    '/api/v1/products?status=SUBMITTED&keyword=TEST-F&page=1&pageSize=1',
    opsToken(['product:view'])
  );
  const body = await res.json();
  expect(body.data).toHaveLength(1);
  expect(body.meta).toEqual({ page: 1, pageSize: 1, total: 2 });
});

test('驳回后商品详情返回最近一条审核意见，未审核时为 null', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:submit', 'product:view']);
  const created = await request('/api/v1/products', 'POST', { ...CREATE_BODY, code: 'TEST-REJ' }, token);
  const detail = (await created.json()).data;
  expect(detail.latestAudit).toBeNull();

  await request(`/api/v1/products/${detail.id}/submit`, 'POST', undefined, token);
  const audit = await prisma.auditRecord.findFirstOrThrow({ where: { productVersionId: detail.currentVersionId } });
  const rejected = await request(
    `/api/v1/audits/${audit.id}/reject`,
    'POST',
    { comment: '图片不清晰' },
    opsToken(['product:audit'])
  );
  expect(rejected.status).toBe(200);

  const res = await get(`/api/v1/products/${detail.id}`, token);
  expect(res.status).toBe(200);
  const body = (await res.json()).data;
  // 只暴露审核状态、意见与时间，不泄露审核人等内部字段。
  expect(body.latestAudit).toEqual({
    status: 'REJECTED',
    comment: '图片不清晰',
    reviewedAt: expect.any(String),
  });
  expect(Object.keys(body.latestAudit).sort()).toEqual(['comment', 'reviewedAt', 'status']);
});

test('可选属性为空字符串时不写入 attributes JSON', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create']);
  const res = await request(
    '/api/v1/products',
    'POST',
    {
      ...CREATE_BODY,
      code: 'TEST-ATTR',
      attributes: { 'attr-demo-home-sofa-material': '棉麻', 'attr-demo-home-sofa-size': '   ' },
    },
    token
  );

  expect(res.status).toBe(200);
  const body = (await res.json()).data;
  expect(body.currentVersion.attributes).toEqual({ 'attr-demo-home-sofa-material': '棉麻' });
  expect(body.currentVersion.attributes).not.toHaveProperty('attr-demo-home-sofa-size');
});
