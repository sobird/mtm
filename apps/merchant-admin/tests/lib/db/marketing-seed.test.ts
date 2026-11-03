import { afterAll, expect, test } from 'vitest';

const { prisma, initDatabase } = await import('@/lib/db');
const { MARKETING_SEED_VERSION } = await import('@/lib/db/seed');

afterAll(() => prisma.$disconnect());

test('seeds marketing data', async () => {
  await initDatabase();
  expect(await prisma.coupon.count()).toBe(11); // 列表 10 条 + 详情独有 1070734573
  expect(await prisma.campaign.count()).toBeGreaterThan(0);
  expect(await prisma.message.count()).toBeGreaterThan(0);
  expect(await prisma.violation.count()).toBeGreaterThan(0);
  expect(await prisma.product.count()).toBeGreaterThan(0);
});

test('derives detail projections and seeds companion entities idempotently', async () => {
  await initDatabase();
  await initDatabase();

  const detail = await prisma.coupon.findUnique({ where: { id: '1070734573' } });
  expect(detail?.rule).toEqual([100, 10]);

  const listRow = await prisma.coupon.findUnique({ where: { id: '500145283' } });
  expect(listRow?.rule).toEqual([10, 2]);
  expect(listRow?.stock).toBe(50);
  expect(listRow?.limit).toBe(1);
  expect(listRow?.putTerm).toEqual([1642867200, 1642953599]);

  expect(await prisma.coupon.count()).toBe(11);
  expect(await prisma.campaign.count()).toBe(10);
  expect(await prisma.message.count()).toBe(4);
  expect(await prisma.message.count({ where: { kind: 'news' } })).toBe(3);
  expect(await prisma.message.count({ where: { kind: 'detail' } })).toBe(1);

  expect(await prisma.violation.count()).toBe(1);
  expect(await prisma.product.count()).toBe(1);
  expect(await prisma.goldPeriod.count()).toBe(1);
  expect(await prisma.goldStandard.count()).toBe(6);
  expect(await prisma.merchantTask.count()).toBe(1);
  expect(await prisma.analysisSnapshot.count()).toBe(3);

  const workbench = await prisma.analysisSnapshot.findUnique({ where: { key: 'workbench' } });
  expect(workbench?.period).toBe('2026-11-03');
  expect(await prisma.seedMeta.count({ where: { version: MARKETING_SEED_VERSION } })).toBe(1);
});
