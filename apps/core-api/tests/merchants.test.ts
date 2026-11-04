import { beforeEach, expect, test } from 'vitest';

import { seedCoreData } from '@/prisma/seed-data';
import { createApp } from '@/src/app';
import { prisma } from '@/src/db';

import { merchantToken, opsToken, resetCoreFixtures } from './helpers';

beforeEach(async () => {
  await resetCoreFixtures();
  await seedCoreData(prisma);
});

async function get(path: string, token: Promise<string>) {
  return createApp().request(path, { headers: { authorization: `Bearer ${await token}` } });
}

async function request(path: string, method: string, body: unknown, token: Promise<string>) {
  const headers: Record<string, string> = { authorization: `Bearer ${await token}` };
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
  }

  return createApp().request(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test('无 cross-tenant 的运营账号只看到授权商家', async () => {
  const scoped = await get('/api/v1/merchants', opsToken(['merchant:view'], ['merchant-demo-2']));
  const body = await scoped.json();
  expect(body.data.map((item: { id: string }) => item.id)).toEqual(['merchant-demo-2']);

  const cross = await get('/api/v1/merchants', opsToken(['merchant:view', 'platform:cross-tenant'], null));
  expect((await cross.json()).data).toHaveLength(3);
});

test('关键字同时匹配商家名称与编码', async () => {
  const res = await get('/api/v1/merchants?keyword=M1001', opsToken(['merchant:view', 'platform:cross-tenant'], null));
  expect(res.status).toBe(200);
  const body = (await res.json()) as { data: { code: string }[] };
  expect(body.data).toHaveLength(1);
  expect(body.data[0].code).toBe('M1001');

  const byName = await get(
    `/api/v1/merchants?keyword=${encodeURIComponent('青禾')}`,
    opsToken(['merchant:view', 'platform:cross-tenant'], null)
  );
  expect((await byName.json()).data.map((item: { code: string }) => item.code)).toEqual(['M1001']);
});

test('访问范围外商家详情返回 403', async () => {
  const res = await get('/api/v1/merchants/merchant-demo-3', opsToken(['merchant:view'], ['merchant-demo-2']));
  expect(res.status).toBe(403);
});

test('商家读取自己的商家与店铺，但不能读取他人店铺', async () => {
  const mine = await get('/api/v1/merchants/me', merchantToken('merchant-demo-1', ['merchant:update']));
  expect(mine.status).toBe(200);
  const detail = (await mine.json()).data;
  expect(detail.id).toBe('merchant-demo-1');
  expect(detail.shops).toHaveLength(2);

  const other = await request(
    '/api/v1/shops/shop-demo-3',
    'PATCH',
    { description: '越权修改' },
    merchantToken('merchant-demo-1', ['shop:update'])
  );
  expect(other.status).toBe(403);
});

test('商家只能更新自己的基础资料，tenant 字段被忽略', async () => {
  const res = await request(
    '/api/v1/merchants/me',
    'PATCH',
    { name: '新商家名', merchantId: 'merchant-demo-2' },
    merchantToken('merchant-demo-1', ['merchant:update'])
  );
  expect(res.status).toBe(200);
  expect((await res.json()).data.name).toBe('新商家名');
  expect((await prisma.merchant.findUniqueOrThrow({ where: { id: 'merchant-demo-1' } })).name).toBe('新商家名');
  expect((await prisma.merchant.findUniqueOrThrow({ where: { id: 'merchant-demo-2' } })).name).not.toBe('新商家名');
});

test('商家 tenant 在 core 中不存在时返回 404', async () => {
  const res = await get('/api/v1/merchants/me', merchantToken('missing-merchant', ['merchant:update']));
  expect(res.status).toBe(404);
  expect(await res.json()).toMatchObject({ error: { code: 'MERCHANT_NOT_FOUND' } });
});

test('店铺列表按运营范围过滤并可分页', async () => {
  const res = await get('/api/v1/shops?page=1&pageSize=10', opsToken(['shop:view'], ['merchant-demo-1']));
  const body = await res.json();
  expect(body.data.every((shop: { merchantId: string }) => shop.merchantId === 'merchant-demo-1')).toBe(true);
  expect(body.meta.total).toBe(2);
});
