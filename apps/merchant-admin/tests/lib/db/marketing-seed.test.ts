import { afterAll, expect, test } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

const { sequelize, initDatabase } = await import('@/lib/db');
const {
  AnalysisSnapshot,
  Campaign,
  Coupon,
  GoldPeriod,
  GoldStandard,
  MerchantTask,
  Message,
  Product,
  SeedMeta,
  Violation,
} = await import('@/lib/db/models');

afterAll(async () => {
  await sequelize.close();
});

test('seeds marketing data', async () => {
  await initDatabase();
  expect(await Coupon.count()).toBe(11); // 列表 10 条 + 详情独有 1070734573
  expect(await Campaign.count()).toBeGreaterThan(0);
  expect(await Message.count()).toBeGreaterThan(0);
  expect(await Violation.count()).toBeGreaterThan(0);
  expect(await Product.count()).toBeGreaterThan(0);
});

test('derives detail projections and seeds companion entities idempotently', async () => {
  await initDatabase();
  await initDatabase();

  const detail = await Coupon.findByPk('1070734573');
  expect(detail?.rule).toEqual([100, 10]);

  const listRow = await Coupon.findByPk('500145283');
  expect(listRow?.rule).toEqual([10, 2]);
  expect(listRow?.stock).toBe(50);
  expect(listRow?.limit).toBe(1);
  expect(listRow?.putTerm).toEqual([1642867200, 1642953599]);

  expect(await Coupon.count()).toBe(11);
  expect(await Campaign.count()).toBe(10);
  expect(await Message.count()).toBe(4);
  expect(await Message.count({ where: { kind: 'news' } })).toBe(3);
  expect(await Message.count({ where: { kind: 'detail' } })).toBe(1);

  expect(await Violation.count()).toBe(1);
  expect(await Product.count()).toBe(1);
  expect(await GoldPeriod.count()).toBe(1);
  expect(await GoldStandard.count()).toBe(6);
  expect(await MerchantTask.count()).toBe(1);
  expect(await AnalysisSnapshot.count()).toBe(3);

  const workbench = await AnalysisSnapshot.findByPk('workbench');
  expect(workbench?.period).toBe('2026-11-03');
  expect(await SeedMeta.findOne({ where: { version: '2026-11-03-marketing' } })).not.toBeNull();
});
