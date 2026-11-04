import { expect, test } from '@playwright/test';

test.describe('login smoke', () => {
  test('ops admin can sign in with the demo account', async ({ page }) => {
    await page.goto('http://localhost:3001/login');

    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await page.locator('[data-testid="login-submit"]').click();

    await page.waitForURL(url => url.pathname === '/');
    expect(new URL(page.url()).pathname).toBe('/');
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });

  test('merchant admin can sign in with the demo password account', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // The merchant login defaults to the mobile + captcha tab; switch to the
    // password tab so the test does not depend on the captcha endpoint.
    await page.getByRole('tab', { name: /密码/ }).click();
    await page.locator('input[name="identifier"]').fill('merchant@example.com');
    await page.locator('input[name="password"]').fill('merchant123');
    await page.locator('[data-testid="login-submit"]').click();

    await page.waitForURL(url => url.pathname === '/');
    expect(new URL(page.url()).pathname).toBe('/');
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });
});
