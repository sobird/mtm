import { afterAll, beforeAll, expect, test, vi } from 'vitest';

vi.mock('@/lib/auth-guard', () => ({
  requireAccount: vi.fn().mockResolvedValue({ accountId: '1', merchantId: '1' }),
}));

const { prisma, initDatabase } = await import('@/lib/db');
const couponRoutes = await import('@/app/api/merchant/coupon/route');
const { GET, DELETE, PATCH } = await import('@/app/api/merchant/coupon/[id]/route');
const { GET: campaignsGET } = await import('@/app/api/merchant/campaigns/route');
const { GET: latestNewsGET } = await import('@/app/api/message/latest-news/route');

// The suite shares one PostgreSQL test database across files, so restore the
// coupon rows this file mutates and remove the row it creates.
let original: Awaited<ReturnType<typeof prisma.coupon.findUnique>> = null;
let createdId: string | undefined;

beforeAll(async () => {
  await initDatabase();
  original = await prisma.coupon.findUnique({ where: { id: '500145265' } });
});

afterAll(async () => {
  if (createdId) {
    await prisma.coupon.deleteMany({ where: { id: createdId } });
  }
  if (original) {
    await prisma.coupon.update({
      where: { id: '500145265' },
      data: {
        name: original.name,
        displayName: original.displayName,
        status: original.status,
        stime: original.stime,
        etime: original.etime,
        putTerm: original.putTerm ?? undefined,
      },
    });
  }
  await prisma.$disconnect();
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

test('GET sorts coupons by a whitelisted column', async () => {
  const res = await couponRoutes.GET(
    new Request('http://localhost/api/merchant/coupon?pn=1&ps=100&sort=sendCount&order=asc'),
    { params: Promise.resolve({}) }
  );
  expect(res.status).toBe(200);
  const counts: number[] = (await res.json()).data.list.map((item: { sendCount: number }) => item.sendCount);
  expect(counts).toEqual([...counts].sort((a, b) => a - b));
  expect(counts.at(0)).toBe(0);
  expect(counts.at(-1)).toBe(100);
});

test('GET rejects a sort field outside the whitelist', async () => {
  const res = await couponRoutes.GET(new Request('http://localhost/api/merchant/coupon?sort=bogus'), {
    params: Promise.resolve({}),
  });
  expect(res.status).toBe(400);
  expect((await res.json()).code).toBe('INVALID_QUERY');
});

test('GET filters coupons by target', async () => {
  const res = await couponRoutes.GET(new Request('http://localhost/api/merchant/coupon?pn=1&ps=100&target=3'), {
    params: Promise.resolve({}),
  });
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.data.list.length).toBeGreaterThan(0);
  expect(body.data.list.every((item: { target: number }) => item.target === 3)).toBe(true);
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
  createdId = body.data.id;
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

test('PATCH derives stime/etime from putTerm and ignores nullish terms', async () => {
  const updated = await PATCH(
    jsonRequest('http://localhost/api/merchant/coupon/500145265', 'PATCH', { putTerm: [1700000000, 1700086400] }),
    { params: Promise.resolve({ id: '500145265' }) }
  );
  expect(updated.status).toBe(200);
  const after = (await updated.json()).data;
  expect(after.stime).toBe(new Date(1700000000 * 1000).toISOString());
  expect(after.etime).toBe(new Date(1700086400 * 1000).toISOString());

  const nullish = await PATCH(
    jsonRequest('http://localhost/api/merchant/coupon/500145265', 'PATCH', { putTerm: [null, null] }),
    { params: Promise.resolve({ id: '500145265' }) }
  );
  expect(nullish.status).toBe(200);
  const preserved = (await nullish.json()).data;
  expect(preserved.stime).toBe(after.stime);
  expect(preserved.etime).toBe(after.etime);
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
