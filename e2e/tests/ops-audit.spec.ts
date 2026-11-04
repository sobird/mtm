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

    // The seed leaves P1002 submitted, but a previous partial run may already have approved
    // it. Search across all statuses and only take the decision when it is still pending.
    await searchAudits(page, 'P1002', 'ALL');

    const row = page.getByRole('row').filter({ hasText: 'P1002' });
    await expect(row).toBeVisible();
    await expect(row).toContainText(/待审核|Pending|已通过|Approved|已驳回|Rejected/);

    if (!/已通过|Approved/.test(await row.innerText())) {
      await row.getByTestId('audit-open').click();
      await expect(page.getByTestId('audit-status')).toContainText(/待审核|Pending/);
      await page.getByTestId('audit-approve').click();
      await expect(page.getByTestId('audit-approve')).toBeHidden();
    }

    await expect(page.getByRole('row').filter({ hasText: 'P1002' })).toContainText(/已通过|Approved/);
  });
});
