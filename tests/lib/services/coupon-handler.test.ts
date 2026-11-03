import { afterAll, expect, test, vi } from 'vitest';

process.env.DATABASE_PATH = ':memory:';

vi.mock('@/lib/auth-guard', () => ({
  requireAccount: vi.fn().mockResolvedValue({ accountId: 1, merchantId: 1 }),
}));

const { initDatabase, sequelize } = await import('@/lib/db');
const couponRoutes = await import('@/app/api/merchant/coupon/route');
const { GET, DELETE, PATCH } = await import('@/app/api/merchant/coupon/[id]/route');
const { GET: campaignsGET } = await import('@/app/api/merchant/campaigns/route');
const { GET: latestNewsGET } = await import('@/app/api/message/latest-news/route');

afterAll(async () => {
  await sequelize.close();
});

function jsonRequest(url: string, method: string, body: unknown): Request {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('DELETE offlines a coupon', async () => {
  await initDatabase();
  const res = await DELETE(new Request('http://localhost/api/merchant/coupon/500145265', { method: 'DELETE' }), {
    params: Promise.resolve({ id: '500145265' }),
  });
  expect(res.status).toBe(200);
  expect((await res.json()).data.status).toBe(6);
});

test('GET returns the coupon detail by id', async () => {
  const res = await GET(new Request('http://localhost/api/merchant/coupon/500145265'), {
    params: Promise.resolve({ id: '500145265' }),
  });
  expect(res.status).toBe(200);
  expect((await res.json()).data.id).toBe('500145265');
});

test('GET lists coupons with pagination', async () => {
  const res = await couponRoutes.GET(new Request('http://localhost/api/merchant/coupon?pn=1&ps=5'), {
    params: Promise.resolve({}),
  });
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.data.pn).toBe(1);
  expect(body.data.ps).toBe(5);
  expect(body.data.list).toHaveLength(5);
});

test('POST creates a coupon and returns the derived rule', async () => {
  const res = await couponRoutes.POST(
    jsonRequest('http://localhost/api/merchant/coupon', 'POST', {
      name: '新建测试券',
      stock: 10,
      limit: 2,
      price: 100,
      discount: 10,
    }),
    { params: Promise.resolve({}) }
  );
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.data.name).toBe('新建测试券');
  expect(body.data.rule).toEqual([100, 10]);
});

test('PATCH updates the coupon name', async () => {
  const res = await PATCH(
    jsonRequest('http://localhost/api/merchant/coupon/500145265', 'PATCH', { name: '改名优惠券' }),
    {
      params: Promise.resolve({ id: '500145265' }),
    }
  );
  expect(res.status).toBe(200);
  expect((await res.json()).data.name).toBe('改名优惠券');
});

test('GET /api/merchant/campaigns returns the seeded page', async () => {
  const res = await campaignsGET(new Request('http://localhost/api/merchant/campaigns'), {
    params: Promise.resolve({}),
  });
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.data.total).toBe(10);
  expect(body.data.list).toHaveLength(10);
});

test('GET /api/message/latest-news returns the news list', async () => {
  const res = await latestNewsGET(new Request('http://localhost/api/message/latest-news'), {
    params: Promise.resolve({}),
  });
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.data).toHaveLength(3);
  expect(body.data.every((item: { kind: string }) => item.kind === 'news')).toBe(true);
});
