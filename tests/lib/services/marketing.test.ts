import { afterAll, expect, test } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

const { sequelize, initDatabase } = await import('@/lib/db');
const { listCoupons, getCoupon, offlineCoupon } = await import('@/lib/services/coupon');
const { listCampaigns } = await import('@/lib/services/campaign');
const { getLatestMessages, getMessage } = await import('@/lib/services/message');
const { getViolationOverview } = await import('@/lib/services/violation');
const { getSellingProduct } = await import('@/lib/services/product');
const { getGold } = await import('@/lib/services/gold');
const { listMerchantTasks } = await import('@/lib/services/merchant-task');
const { getWorkbench, getTrending, getOperation } = await import('@/lib/services/analysis');

afterAll(async () => {
  await sequelize.close();
});

test('list total comes from the database, not the mock', async () => {
  await initDatabase();
  const res = await listCoupons({ pn: 1, ps: 10 });
  expect(res.total).toBe(11);
  expect(res.list).toHaveLength(10);
});

test('detail id absent from the list is still retrievable', async () => {
  const res = await getCoupon('1070734573');
  expect(res.rule).toEqual([100, 10]);
});

test('offlineCoupon sets status to 6', async () => {
  const res = await offlineCoupon('500145265');
  expect(res.status).toBe(6);
  const again = await getCoupon('500145265');
  expect(again.status).toBe(6);
});

test('campaign total and page size come from the database', async () => {
  const res = await listCampaigns({ pn: 1, ps: 10 });
  expect(res.total).toBe(10);
  expect(res.list).toHaveLength(10);
});

test('latest messages are news while detail lookup reads the detail row', async () => {
  const news = await getLatestMessages();
  expect(news).toHaveLength(3);
  expect(news.every(item => item.kind === 'news')).toBe(true);

  const detail = await getMessage('1');
  expect(detail.kind).toBe('detail');
  expect(detail.title).toBe('测试弹窗立即关闭');
});

test('violation overview exposes the seeded counters', async () => {
  const overview = await getViolationOverview();
  expect(overview.issueCount).toBe(32);
  expect(overview.appealCount).toBe(6);
  expect(overview.ticketAmount).toBe(1434);
});

test('selling products report the seeded total', async () => {
  const res = await getSellingProduct();
  expect(res.total).toBe(324);
  expect(res.items).toEqual([]);
});

test('gold returns the seeded period standards', async () => {
  const res = await getGold(1, 1);
  expect(res.standards).toHaveLength(6);
  expect(res.currentPeriodSTime).toBe('2023-09-10');
});

test('merchant tasks return the single seeded task', async () => {
  const tasks = await listMerchantTasks(1);
  expect(tasks).toHaveLength(1);
  expect(tasks[0].curTaskCount).toBe(12);
});

test('analysis snapshots expose their payloads', async () => {
  expect((await getWorkbench()).overview).toBeDefined();
  expect((await getTrending()).transactionLine).toEqual([]);
  expect((await getOperation()).scoreSet).toBeDefined();
});
