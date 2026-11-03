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

test('运营端按 category:view 读取扁平类目树', async () => {
  const res = await get('/api/v1/categories/tree', opsToken(['category:view']));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.data.length).toBe(23);
  expect(body.data[0]).toMatchObject({ level: 1, parentId: null });
  expect(body.data.some((node: { level: number }) => node.level === 3)).toBe(true);
});

test('商家拥有商品权限时可只读类目，但没有管理权限', async () => {
  expect((await get('/api/v1/categories/tree', merchantToken(DEMO_MERCHANT_ID, ['product:view']))).status).toBe(200);
  expect(
    (
      await request(
        '/api/v1/categories',
        'POST',
        { name: '新类目' },
        merchantToken(DEMO_MERCHANT_ID, ['product:update'])
      )
    ).status
  ).toBe(403);
});

test('创建二级类目自动计算 level 与 path，超过三级被拒绝', async () => {
  const parent = await prisma.category.findFirstOrThrow({ where: { level: 1 } });
  const created = await request(
    '/api/v1/categories',
    'POST',
    { parentId: parent.id, name: '新二级' },
    opsToken(['category:manage'])
  );
  expect(created.status).toBe(200);
  const node = (await created.json()).data;
  expect(node.level).toBe(2);
  expect(node.path.startsWith(`${parent.path}/`)).toBe(true);

  const leaf = await prisma.category.findFirstOrThrow({ where: { level: 3 } });
  const tooDeep = await request(
    '/api/v1/categories',
    'POST',
    { parentId: leaf.id, name: '第四级' },
    opsToken(['category:manage'])
  );
  expect(tooDeep.status).toBe(400);
  expect(await tooDeep.json()).toMatchObject({ error: { code: 'CATEGORY_LEVEL_LIMIT' } });
});

test('删除有子类目的类目返回 409，删除叶子成功', async () => {
  const parent = await prisma.category.findFirstOrThrow({ where: { level: 1 } });
  const blocked = await request(`/api/v1/categories/${parent.id}`, 'DELETE', undefined, opsToken(['category:manage']));
  expect(blocked.status).toBe(409);
  expect(await blocked.json()).toMatchObject({ error: { code: 'CATEGORY_HAS_CHILDREN' } });

  const leaf = await prisma.category.findFirstOrThrow({ where: { level: 3, children: { none: {} } } });
  expect(
    (await request(`/api/v1/categories/${leaf.id}`, 'DELETE', undefined, opsToken(['category:manage']))).status
  ).toBe(200);
  expect(await prisma.category.findUnique({ where: { id: leaf.id } })).toBeNull();
});

test('修改类目名称/状态/属性', async () => {
  const leaf = await prisma.category.findFirstOrThrow({ where: { level: 3 } });
  const res = await request(
    `/api/v1/categories/${leaf.id}`,
    'PATCH',
    { name: '改名类目', status: 'DISABLED', attributes: [{ name: '颜色', type: 'TEXT' }] },
    opsToken(['category:manage'])
  );
  expect(res.status).toBe(200);
  const node = (await res.json()).data;
  expect(node.name).toBe('改名类目');
  expect(node.status).toBe('DISABLED');
  expect(node.attributes).toHaveLength(1);
});
