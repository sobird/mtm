import path from 'node:path';

import { createSessionCookie } from './session-cookie';

/**
 * Production-build smoke test (Task 25).
 *
 * Delete the stale database, then start the built server against that path.
 * The script never deletes the file itself: a live SQLite connection holds it
 * open, and unlinking it leaves the server writing to an orphaned inode. For
 * the restart-persistence check, keep the file and start the server again.
 * The standalone server changes its cwd to `.next/standalone`, so pass an
 * absolute path:
 *
 *   rm -f data/smoke.sqlite
 *   NODE_ENV=production DATABASE_PATH="$(pwd)/data/smoke.sqlite" AUTH_SECRET=test-secret PORT=3000 \
 *     node .next/standalone/server.js &
 *   AUTH_SECRET=test-secret bun run smoke
 */

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const DATABASE_PATH = path.resolve(process.env.SMOKE_DATABASE_PATH ?? './data/smoke.sqlite');
const REQUEST_TIMEOUT_MS = 15_000;
const READY_TIMEOUT_MS = 30_000;

if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET must be set to the same value the smoke server was started with');
}

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/register/success',
  '/settleinpc',
  '/settleinjx/home',
  '/settleinjx/shop',
  '/settleinjx/company',
];

const PROTECTED_ROUTES = [
  '/',
  '/market/coupons',
  '/market/home',
  '/market/coupon/create?target=1',
  '/setting',
  '/shop/admin',
  '/shop/trademark',
  '/shop/profile',
  '/shop/profile/principal',
  '/shop/profile/license',
  '/shop/profile/wallet',
  '/shop/profile/settlement',
];

const REDIRECT_STATUSES = new Set([302, 307]);

let failureCount = 0;

function record(label: string, passed: boolean, detail: string): void {
  if (!passed) {
    failureCount += 1;
  }

  console.log(`${passed ? 'PASS' : 'FAIL'}  ${label}  —  ${detail}`);
}

function request(pathname: string, init: RequestInit = {}): Promise<Response> {
  return fetch(new URL(pathname, BASE_URL), {
    redirect: 'manual',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    ...init,
  });
}

type HealthBody = { code?: number; data?: { db?: boolean } | null } | null;

async function probeHealth(): Promise<HealthBody> {
  try {
    const response = await request('/api/health');

    if (response.ok) {
      return (await response.json()) as HealthBody;
    }
  } catch {
    // Server not up yet.
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(deadline = Date.now() + READY_TIMEOUT_MS): Promise<void> {
  const body = await probeHealth();

  if (body?.code === 0 && body.data?.db === true) {
    record('GET /api/health', true, `200, db=${body.data.db}`);
    return;
  }

  if (Date.now() >= deadline) {
    throw new Error(`Server did not become ready within ${READY_TIMEOUT_MS}ms at ${BASE_URL}`);
  }

  await sleep(500);
  await waitForServer(deadline);
}

async function checkPublicRoutes(): Promise<void> {
  await Promise.all(
    PUBLIC_ROUTES.map(async route => {
      const response = await request(route);
      record(`GET ${route} (anonymous)`, response.status === 200, `status ${response.status}`);
    })
  );
}

async function checkAnonymousRedirects(): Promise<void> {
  await Promise.all(
    ['/', '/market/coupons'].map(async route => {
      const response = await request(route);
      const location = response.headers.get('location') ?? '';
      const passed = REDIRECT_STATUSES.has(response.status) && location.includes('/login');

      record(`GET ${route} (anonymous)`, passed, `status ${response.status} -> ${location || '(no location)'}`);
    })
  );
}

async function checkProtectedRoutes(cookie: string): Promise<void> {
  await Promise.all(
    PROTECTED_ROUTES.map(async route => {
      const response = await request(route, { headers: { cookie } });
      record(`GET ${route} (authenticated)`, response.status === 200, `status ${response.status}`);
    })
  );

  // `/market` is an intentional server redirect to the dashboard.
  const marketResponse = await request('/market', { headers: { cookie } });
  const marketLocation = marketResponse.headers.get('location') ?? '';
  const marketPassed = REDIRECT_STATUSES.has(marketResponse.status) && marketLocation.includes('/market/home');

  record(
    'GET /market (authenticated)',
    marketPassed,
    `status ${marketResponse.status} -> ${marketLocation || '(no location)'}`
  );
}

interface CouponPayload {
  id?: string;
  status?: number;
  name?: string;
}

interface ApiEnvelope<T> {
  code: number | string;
  message: string;
  data: T | null;
}

async function readJson<T>(response: Response): Promise<ApiEnvelope<T> | null> {
  try {
    return (await response.json()) as ApiEnvelope<T>;
  } catch {
    return null;
  }
}

async function checkCouponFlow(cookie: string): Promise<void> {
  const authHeaders = { cookie, 'content-type': 'application/json' };

  // API routes must reject anonymous requests with a 401 envelope.
  const anonymousList = await request('/api/merchant/coupon');
  const anonymousBody = await readJson<unknown>(anonymousList);

  record(
    'GET /api/merchant/coupon (anonymous)',
    anonymousList.status === 401 && anonymousBody?.code === 'UNAUTHORIZED',
    `status ${anonymousList.status}, code ${anonymousBody?.code ?? '(unparseable)'}`
  );

  const createResponse = await request('/api/merchant/coupon', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: '回归测试券',
      displayName: '回归测试券',
      type: 1,
      target: 1,
      stock: 10,
      limit: 1,
      price: 100,
      discount: 10,
    }),
  });
  const created = await readJson<CouponPayload>(createResponse);
  const couponId = created?.data?.id;

  record(
    'POST /api/merchant/coupon',
    createResponse.status === 200 && created?.code === 0 && typeof couponId === 'string',
    `status ${createResponse.status}, code ${created?.code ?? '(unparseable)'}, id ${couponId ?? '(none)'}`
  );

  if (!couponId) {
    return;
  }

  const listResponse = await request('/api/merchant/coupon?pn=1&ps=100', { headers: { cookie } });
  const list = await readJson<{ list: CouponPayload[] }>(listResponse);
  const listed = list?.data?.list?.some(item => item.id === couponId) ?? false;

  record(
    'GET /api/merchant/coupon (created coupon present)',
    listResponse.status === 200 && list?.code === 0 && listed,
    `status ${listResponse.status}, found ${listed}`
  );

  const detailResponse = await request(`/api/merchant/coupon/${encodeURIComponent(couponId)}`, {
    headers: { cookie },
  });
  const detail = await readJson<CouponPayload>(detailResponse);

  record(
    `GET /api/merchant/coupon/${couponId}`,
    detailResponse.status === 200 && detail?.code === 0 && detail.data?.id === couponId,
    `status ${detailResponse.status}, code ${detail?.code ?? '(unparseable)'}`
  );

  const deleteResponse = await request(`/api/merchant/coupon/${encodeURIComponent(couponId)}`, {
    method: 'DELETE',
    headers: { cookie },
  });
  const deleted = await readJson<CouponPayload>(deleteResponse);

  record(
    `DELETE /api/merchant/coupon/${couponId}`,
    deleteResponse.status === 200 && deleted?.code === 0 && deleted.data?.status === 6,
    `status ${deleteResponse.status}, coupon status ${deleted?.data?.status ?? '(none)'}`
  );

  await Promise.all(
    [`/market/coupon/${encodeURIComponent(couponId)}`, `/market/coupon/update/${encodeURIComponent(couponId)}`].map(
      async route => {
        const response = await request(route, { headers: { cookie } });
        record(`GET ${route} (authenticated)`, response.status === 200, `status ${response.status}`);
      }
    )
  );
}

async function main(): Promise<void> {
  console.log(`Smoke target: ${BASE_URL}`);
  console.log(`Smoke database: ${DATABASE_PATH}\n`);

  await waitForServer();

  const cookie = await createSessionCookie();

  await checkPublicRoutes();
  await checkAnonymousRedirects();
  await checkProtectedRoutes(cookie);
  await checkCouponFlow(cookie);

  console.log('');

  if (failureCount > 0) {
    console.error(`${failureCount} smoke check(s) failed.`);
    process.exitCode = 1;
    return;
  }

  console.log('All smoke checks passed.');
}

main().catch(error => {
  console.error('Smoke run crashed:', error);
  process.exitCode = 1;
});
