import { expect, type Page } from '@playwright/test';

/**
 * Same names as the Task 19 smoke so there is one convention:
 * `E2E_*` overrides for local runs, committed defaults for CI.
 */
export const MERCHANT_URL = process.env.E2E_MERCHANT_URL ?? 'http://localhost:3000';
export const OPS_URL = process.env.E2E_OPS_URL ?? 'http://localhost:3001';

export const MERCHANT_OWNER = { identifier: 'merchant@example.com', password: 'merchant123' };
export const MERCHANT_STAFF = { identifier: 'staff@example.com', password: 'staff123' };
export const OPS_ADMIN = { username: 'admin', password: 'admin123' };

/** The specs share one database, so every created name/code must be unique. */
export function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/** Merchant login defaults to the mobile/captcha tab; switch to the password tab first. */
export async function loginMerchant(
  page: Page,
  identifier: string = MERCHANT_OWNER.identifier,
  password: string = MERCHANT_OWNER.password
): Promise<void> {
  await page.goto(`${MERCHANT_URL}/login`);
  await page.getByRole('tab', { name: /密码|Password/ }).click();
  await page.locator('input[name="identifier"]').fill(identifier);
  await page.locator('input[name="password"]').fill(password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(url => url.pathname === '/');
  await expect(page.getByRole('navigation').first()).toBeVisible();
}

export async function loginOps(
  page: Page,
  username: string = OPS_ADMIN.username,
  password: string = OPS_ADMIN.password
): Promise<void> {
  await page.goto(`${OPS_URL}/login`);
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(url => url.pathname === '/');
  await expect(page.getByRole('navigation').first()).toBeVisible();
}

/** Selects an option from the shared base-ui Select wrapper by its trigger test id. */
export async function chooseOption(page: Page, testId: string, optionName: string | RegExp): Promise<void> {
  await page.getByTestId(testId).click();
  await page.getByRole('option', { name: optionName }).click();
}

/** Opens the merchant list and filters it by keyword (the unique product code). */
export async function searchMerchantProducts(page: Page, code: string): Promise<void> {
  await page.goto(`${MERCHANT_URL}/products`);

  const searchForm = page.locator('form').first();
  await searchForm.locator('input').first().fill(code);
  await searchForm.getByRole('button', { name: /查询|Search/ }).click();
}

/** Filters the merchant list by code, opens the detail page and waits for its status tag. */
export async function openMerchantProduct(page: Page, code: string): Promise<void> {
  await searchMerchantProducts(page, code);

  const row = page.getByRole('row').filter({ hasText: code });
  await expect(row).toBeVisible();
  await row
    .getByRole('button', { name: /编辑|查看|Edit|View/ })
    .first()
    .click();

  await expect(page).toHaveURL(/\/products\/[^/]+$/);
  await expect(page.getByTestId('product-status')).toBeVisible();
}

/**
 * Opens the ops audits page and filters by keyword (and optionally audit status).
 * The status select uses a base-ui trigger labelled by the translated filter name.
 */
export async function searchAudits(
  page: Page,
  keyword: string,
  statusOption?: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
): Promise<void> {
  await page.goto(`${OPS_URL}/audits`);

  const searchForm = page.locator('form').first();
  await searchForm.locator('input').first().fill(keyword);

  if (statusOption) {
    await page.getByRole('combobox', { name: /审核状态筛选|Audit status filter/ }).click();
    await page.getByRole('option', { name: statusLabel(statusOption) }).click();
  }

  await searchForm.getByRole('button', { name: /查询|Search/ }).click();
}

function statusLabel(status: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'): RegExp {
  switch (status) {
    case 'ALL':
      return /全部|All/;
    case 'PENDING':
      return /待审核|Pending/;
    case 'APPROVED':
      return /已通过|Approved/;
    case 'REJECTED':
      return /已驳回|Rejected/;
  }
}
