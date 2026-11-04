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

async function createSubmittedProduct(code: string): Promise<string> {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create', 'product:submit']);
  const created = await request(
    '/api/v1/products',
    'POST',
    {
      shopId: 'shop-demo-1',
      code,
      categoryId: 'category-demo-home-sofa',
      brandId: 'brand-demo-1',
      title: `待审商品 ${code}`,
      subtitle: null,
      images: ['data:image/svg+xml;utf8,<svg/>'],
      description: '描述',
      attributes: { 'attr-demo-home-sofa-material': '棉麻' },
      skus: [{ skuCode: `${code}-1`, specs: { 规格: '三人位' }, price: 100, stock: 1 }],
    },
    token
  );
  const detail = (await created.json()).data;
  await request(`/api/v1/products/${detail.id}/submit`, 'POST', undefined, token);
  const audit = await prisma.auditRecord.findFirstOrThrow({ where: { productVersionId: detail.currentVersionId } });
  return audit.id;
}

test('运营审核通过把版本置为 APPROVED', async () => {
  const auditId = await createSubmittedProduct('AUD-1');
  const res = await request(
    `/api/v1/audits/${auditId}/approve`,
    'POST',
    { comment: '通过' },
    opsToken(['product:audit'])
  );

  expect(res.status).toBe(200);
  const audit = (await res.json()).data;
  expect(audit.status).toBe('APPROVED');
  expect(audit.reviewerId).toBe('ops-test');
  expect(audit.product.code).toBe('AUD-1');

  const version = await prisma.productVersion.findUniqueOrThrow({ where: { id: audit.productVersionId } });
  expect(version.status).toBe('APPROVED');
});

test('重复审核返回 409 且状态只变更一次', async () => {
  const auditId = await createSubmittedProduct('AUD-2');
  const token = opsToken(['product:audit']);

  expect((await request(`/api/v1/audits/${auditId}/approve`, 'POST', {}, token)).status).toBe(200);
  const again = await request(`/api/v1/audits/${auditId}/reject`, 'POST', { comment: '驳回' }, token);
  expect(again.status).toBe(409);
  expect(await again.json()).toMatchObject({ error: { code: 'AUDIT_ALREADY_REVIEWED' } });

  const audit = await prisma.auditRecord.findUniqueOrThrow({ where: { id: auditId } });
  expect(audit.status).toBe('APPROVED');
});

test('驳回必须填写原因，填写后版本变为 REJECTED', async () => {
  const auditId = await createSubmittedProduct('AUD-3');
  const token = opsToken(['product:audit']);

  const missing = await request(`/api/v1/audits/${auditId}/reject`, 'POST', {}, token);
  expect(missing.status).toBe(400);

  const res = await request(`/api/v1/audits/${auditId}/reject`, 'POST', { comment: '图片不清晰' }, token);
  expect(res.status).toBe(200);
  expect((await res.json()).data.status).toBe('REJECTED');

  const audit = await prisma.auditRecord.findUniqueOrThrow({ where: { id: auditId } });
  const version = await prisma.productVersion.findUniqueOrThrow({ where: { id: audit.productVersionId } });
  expect(version.status).toBe('REJECTED');
});

test('审核列表按状态过滤并返回商品信息，meta.total 不随分页变化', async () => {
  const auditId = await createSubmittedProduct('AUD-5');
  const token = opsToken(['product:audit']);

  // keyword 限定到本用例创建的商品，避免种子待审记录计入精确计数。
  const pending = await get('/api/v1/audits?status=PENDING&keyword=AUD-5', token);
  expect(pending.status).toBe(200);
  const pendingBody = await pending.json();
  expect(pendingBody.meta.total).toBe(1);
  expect(pendingBody.data).toHaveLength(1);
  expect(pendingBody.data[0]).toMatchObject({
    id: auditId,
    status: 'PENDING',
    product: {
      code: 'AUD-5',
      title: '待审商品 AUD-5',
      merchantName: '青禾家居有限公司',
    },
  });

  expect((await request(`/api/v1/audits/${auditId}/approve`, 'POST', { comment: '通过' }, token)).status).toBe(200);

  const approved = await get('/api/v1/audits?status=APPROVED&keyword=AUD-5', token);
  expect((await approved.json()).meta.total).toBe(1);

  const stillPending = await get('/api/v1/audits?status=PENDING&keyword=AUD-5', token);
  expect((await stillPending.json()).meta.total).toBe(0);

  const paged = await get('/api/v1/audits?status=APPROVED&keyword=AUD-5&page=1&pageSize=1', token);
  expect((await paged.json()).meta).toMatchObject({ page: 1, pageSize: 1, total: 1 });
});

test('版本状态漂移时审核返回 409 且审核记录回滚', async () => {
  const auditId = await createSubmittedProduct('AUD-6');
  const audit = await prisma.auditRecord.findUniqueOrThrow({ where: { id: auditId } });
  await prisma.productVersion.update({
    where: { id: audit.productVersionId },
    data: { status: 'APPROVED' },
  });

  const res = await request(
    `/api/v1/audits/${auditId}/approve`,
    'POST',
    { comment: '通过' },
    opsToken(['product:audit'])
  );
  expect(res.status).toBe(409);
  expect(await res.json()).toMatchObject({ error: { code: 'AUDIT_VERSION_CONFLICT' } });

  const after = await prisma.auditRecord.findUniqueOrThrow({ where: { id: auditId } });
  expect(after.status).toBe('PENDING');
  expect(after.reviewerId).toBeNull();
  expect(after.reviewedAt).toBeNull();
});

test('并发通过/驳回只成功一个，审核信息只落一次', async () => {
  const auditId = await createSubmittedProduct('AUD-7');
  const token = opsToken(['product:audit']);

  const [approveRes, rejectRes] = await Promise.all([
    request(`/api/v1/audits/${auditId}/approve`, 'POST', { comment: '通过' }, token),
    request(`/api/v1/audits/${auditId}/reject`, 'POST', { comment: '驳回' }, token),
  ]);

  expect([approveRes.status, rejectRes.status].sort()).toEqual([200, 409]);
  const conflict = approveRes.status === 409 ? approveRes : rejectRes;
  expect(await conflict.json()).toMatchObject({ error: { code: 'AUDIT_ALREADY_REVIEWED' } });

  const audit = await prisma.auditRecord.findUniqueOrThrow({ where: { id: auditId } });
  expect(['APPROVED', 'REJECTED']).toContain(audit.status);
  expect(audit.reviewerId).toBe('ops-test');
  expect(audit.reviewedAt).not.toBeNull();
});

test('软删除商品的审核记录仍可被运营查看', async () => {
  const auditId = await createSubmittedProduct('AUD-8');
  const token = opsToken(['product:audit']);
  expect((await request(`/api/v1/audits/${auditId}/approve`, 'POST', {}, token)).status).toBe(200);

  const audit = await prisma.auditRecord.findUniqueOrThrow({ where: { id: auditId } });
  const version = await prisma.productVersion.findUniqueOrThrow({ where: { id: audit.productVersionId } });
  await prisma.product.update({ where: { id: version.productId }, data: { deletedAt: new Date() } });

  const list = await get('/api/v1/audits?status=APPROVED', token);
  const body = await list.json();
  expect(list.status).toBe(200);
  expect(body.meta.total).toBe(1);
  expect(body.data[0]).toMatchObject({ id: auditId, product: { code: 'AUD-8' } });

  const detail = await get(`/api/v1/audits/${auditId}`, token);
  expect(detail.status).toBe(200);
  expect((await detail.json()).data.product.code).toBe('AUD-8');
});

test('通过时空白备注落为 null', async () => {
  const auditId = await createSubmittedProduct('AUD-9');
  const res = await request(
    `/api/v1/audits/${auditId}/approve`,
    'POST',
    { comment: '   ' },
    opsToken(['product:audit'])
  );

  expect(res.status).toBe(200);
  expect((await res.json()).data.comment).toBeNull();
  const audit = await prisma.auditRecord.findUniqueOrThrow({ where: { id: auditId } });
  expect(audit.comment).toBeNull();
});

test('运营只能看到审核范围内的记录', async () => {
  const auditId = await createSubmittedProduct('AUD-4');

  const list = await get('/api/v1/audits?status=PENDING', opsToken(['product:audit'], ['merchant-demo-2']));
  const body = await list.json();
  expect(list.status).toBe(200);
  expect(body.meta.total).toBe(0);

  const outOfScope = await get(`/api/v1/audits/${auditId}`, opsToken(['product:audit'], ['merchant-demo-2']));
  expect(outOfScope.status).toBe(403);
});
