import { expect, test } from '@playwright/test';

import { loginMerchant, MERCHANT_STAFF, MERCHANT_URL, OPS_URL } from './helpers';

test.describe('RBAC', () => {
  test('staff visiting the accounts page is redirected to 403', async ({ page }) => {
    await loginMerchant(page, MERCHANT_STAFF.identifier, MERCHANT_STAFF.password);

    await page.goto(`${MERCHANT_URL}/system/accounts`);
    await page.waitForURL(url => url.pathname === '/403');

    await expect(page.getByRole('heading', { name: /无权访问|Access denied/ })).toBeVisible();
  });

  test('staff cannot create roles through the API', async ({ page }) => {
    await loginMerchant(page, MERCHANT_STAFF.identifier, MERCHANT_STAFF.password);
    await page.goto(`${MERCHANT_URL}/products`);

    const status = await page.evaluate(async () => {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: 'e2e-forbidden', name: 'E2E forbidden', permissionCodes: [] }),
      });

      return response.status;
    });

    expect(status).toBe(403);
  });

  test('unauthenticated ops BFF request returns 401', async ({ request }) => {
    const response = await request.get(`${OPS_URL}/api/bff/products`, {
      headers: { 'sec-fetch-site': 'same-origin' },
    });

    expect(response.status()).toBe(401);
  });
});
