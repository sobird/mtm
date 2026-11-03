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

test('运营端分页查询品牌并按关键字过滤', async () => {
  const res = await get('/api/v1/brands?page=1&pageSize=5&keyword=青', opsToken(['brand:manage']));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.meta).toMatchObject({ page: 1, pageSize: 5 });
  expect(body.data.every((brand: { name: string }) => brand.name.includes('青'))).toBe(true);
});

test('商家只能读取品牌', async () => {
  expect((await get('/api/v1/brands', merchantToken(DEMO_MERCHANT_ID, ['product:view']))).status).toBe(200);
  expect(
    (await request('/api/v1/brands', 'POST', { name: '新品牌' }, merchantToken(DEMO_MERCHANT_ID, ['product:update'])))
      .status
  ).toBe(403);
});

test('重名品牌返回 409 而不是 500', async () => {
  const res = await request('/api/v1/brands', 'POST', { name: '青禾' }, opsToken(['brand:manage']));
  expect(res.status).toBe(409);
  expect(await res.json()).toMatchObject({ error: { code: 'BRAND_EXISTS' } });
});

test('修改品牌名称与状态', async () => {
  const brand = await prisma.brand.findFirstOrThrow();
  const res = await request(
    `/api/v1/brands/${brand.id}`,
    'PATCH',
    { name: '改名品牌', status: 'DISABLED' },
    opsToken(['brand:manage'])
  );
  expect(res.status).toBe(200);
  expect((await res.json()).data).toMatchObject({ name: '改名品牌', status: 'DISABLED' });
});
