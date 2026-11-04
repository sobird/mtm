import { expect, test } from '@playwright/test';

import { loginOps, OPS_URL, searchAudits, unique } from './helpers';

test.describe('ops audit', () => {
  test('creates a root category and approves the seeded pending product', async ({ page }) => {
    await loginOps(page);

    // Creating a category proves the ops write path works before touching audits.
    const categoryName = unique('E2E 类目');
    await page.goto(`${OPS_URL}/categories`);
    await page.getByTestId('category-create').click();
    await page.getByTestId('category-name').fill(categoryName);
    await page.getByTestId('category-save').click();

    const categoryRow = page.getByRole('row').filter({ hasText: categoryName });
    await expect(categoryRow).toBeVisible();

    // The seed leaves P1002 submitted; the list defaults to the PENDING filter.
    await searchAudits(page, 'P1002');

    const pendingRow = page.getByRole('row').filter({ hasText: 'P1002' });
    await expect(pendingRow).toBeVisible();

    await pendingRow.getByTestId('audit-open').click();
    await expect(page.getByTestId('audit-status')).toContainText(/待审核|Pending/);
    await page.getByTestId('audit-approve').click();
    await expect(page.getByTestId('audit-approve')).toBeHidden();

    // After approval the PENDING filter no longer contains the row; switch to APPROVED.
    await searchAudits(page, 'P1002', 'APPROVED');

    const approvedRow = page.getByRole('row').filter({ hasText: 'P1002' });
    await expect(approvedRow).toBeVisible();
    await expect(approvedRow).toContainText(/已通过|Approved/);
  });
});
