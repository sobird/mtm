import { expect, test } from '@playwright/test';

import { loginMerchant, loginOps, MERCHANT_URL, OPS_URL } from './helpers';

test.describe('locale switching', () => {
  test('merchant portal switches to English and restores Chinese', async ({ page, context, browser }) => {
    await loginMerchant(page);
    await page.goto(`${MERCHANT_URL}/products`);
    await expect(page.getByRole('heading', { name: '商品列表' })).toBeVisible();

    await page.getByTestId('locale-switcher').selectOption('en-US');
    await expect(page.getByRole('heading', { name: 'Products', exact: true })).toBeVisible();
    await expect(
      page.getByRole('navigation').first().getByRole('link', { name: 'Products', exact: true })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create product', exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Products', exact: true })).toBeVisible();

    // The switcher persisted the locale cookie; a fresh session renders the English login page.
    const localeCookie = (await context.cookies(MERCHANT_URL)).find(cookie => cookie.name === 'NEXT_LOCALE');
    expect(localeCookie?.value).toBe('en-US');

    const loginContext = await browser.newContext();
    await loginContext.addCookies([{ name: 'NEXT_LOCALE', value: 'en-US', url: MERCHANT_URL }]);
    const loginPage = await loginContext.newPage();
    await loginPage.goto(`${MERCHANT_URL}/login`);
    await expect(loginPage.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
    await loginContext.close();

    await page.getByTestId('locale-switcher').selectOption('zh-CN');
    await expect(page.getByRole('heading', { name: '商品列表' })).toBeVisible();
  });

  test('ops portal switches to English and restores Chinese', async ({ page, context, browser }) => {
    await loginOps(page);
    await page.goto(`${OPS_URL}/audits`);
    await expect(page.getByRole('heading', { name: '商品审核' })).toBeVisible();

    await page.getByTestId('locale-switcher').selectOption('en-US');
    await expect(page.getByRole('heading', { name: 'Product review', exact: true })).toBeVisible();
    await expect(
      page.getByRole('navigation').first().getByRole('link', { name: 'Product audits', exact: true })
    ).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Product review', exact: true })).toBeVisible();

    const localeCookie = (await context.cookies(OPS_URL)).find(cookie => cookie.name === 'NEXT_LOCALE');
    expect(localeCookie?.value).toBe('en-US');

    const loginContext = await browser.newContext();
    await loginContext.addCookies([{ name: 'NEXT_LOCALE', value: 'en-US', url: OPS_URL }]);
    const loginPage = await loginContext.newPage();
    await loginPage.goto(`${OPS_URL}/login`);
    await expect(loginPage.getByRole('heading', { name: 'Ops admin sign in', exact: true })).toBeVisible();
    await loginContext.close();

    await page.getByTestId('locale-switcher').selectOption('zh-CN');
    await expect(page.getByRole('heading', { name: '商品审核' })).toBeVisible();
  });
});
