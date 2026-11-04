import { DEMO_MERCHANT_ID } from '@mtm/contracts';
import { beforeEach, expect, test } from 'vitest';

import { seedCoreData } from '@/prisma/seed-data';
import { createApp } from '@/src/app';
import { prisma } from '@/src/db';
import { recordCoreOperationLog } from '@/src/services/operation-log';

import { merchantToken, resetCoreFixtures } from './helpers';

beforeEach(async () => {
  await resetCoreFixtures();
  await seedCoreData(prisma);
});

// 复制自 tests/products.test.ts，避免改动既有测试的导出。
const CREATE_BODY = {
  shopId: 'shop-demo-1',
  code: 'TEST-LOG1',
  categoryId: 'category-demo-home-sofa',
  brandId: 'brand-demo-1',
  title: '日志沙发',
  subtitle: null,
  images: ['data:image/svg+xml;utf8,<svg/>'],
  description: '日志测试描述',
  attributes: { 'attr-demo-home-sofa-material': '棉麻' },
  skus: [{ skuCode: 'TEST-LOG1-1', specs: { 规格: '三人位' }, price: 2599, stock: 10 }],
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

test('创建商品写入 product.create 核心日志', async () => {
  const token = merchantToken(DEMO_MERCHANT_ID, ['product:create']);
  const res = await request('/api/v1/products', 'POST', CREATE_BODY, token);
  const detail = (await res.json()).data;
  const log = await prisma.coreOperationLog.findFirstOrThrow({ where: { action: 'product.create' } });
  expect(log).toMatchObject({
    portal: 'merchant',
    actorId: 'merchant-test',
    actorMerchantId: DEMO_MERCHANT_ID,
    resource: 'product',
    resourceId: detail.id,
  });
  expect(log.detail).toMatchObject({ versionId: detail.currentVersionId });
});

test('日志写入与业务变更在同一事务，抛错时一起回滚', async () => {
  await expect(
    prisma.$transaction(async tx => {
      await recordCoreOperationLog(
        tx,
        { portal: 'merchant', userId: 'u1', merchantId: 'm1', permissions: [], merchantScope: null },
        {
          action: 'product.delete',
          resource: 'product',
          resourceId: 'p1',
        }
      );
      throw new Error('boom');
    })
  ).rejects.toThrow('boom');
  expect(await prisma.coreOperationLog.count()).toBe(0);
});
