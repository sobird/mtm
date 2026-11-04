import { expect, test } from '@playwright/test';

import {
  chooseOption,
  loginMerchant,
  loginOps,
  MERCHANT_URL,
  openMerchantProduct,
  searchAudits,
  searchMerchantProducts,
  unique,
} from './helpers';

const SAVE_BUTTON = /^(保存|Save)$/;

test.describe('merchant product lifecycle', () => {
  test('create, submit, reject, resubmit, approve and publish', async ({ browser }) => {
    // Two contexts so the merchant and ops sessions coexist in one scenario.
    const merchantContext = await browser.newContext();
    const opsContext = await browser.newContext();
    const merchant = await merchantContext.newPage();
    const ops = await opsContext.newPage();

    try {
      await loginMerchant(merchant);
      await loginOps(ops);

      const code = unique('E2E-P');
      const title = unique('E2E Product');
      const rejectReason = unique('E2E reject reason');

      // 1. Create a draft with an uploaded image, seeded category/brand and SKU.
      await merchant.goto(`${MERCHANT_URL}/products/new`);
      await merchant.getByTestId('product-code').fill(code);
      await chooseOption(merchant, 'product-category', /沙发/);
      await chooseOption(merchant, 'product-brand', /青禾/);
      await merchant.getByTestId('product-title').fill(title);
      await merchant.locator('textarea[name="description"]').fill(`E2E description ${code}`);
      await merchant.getByTestId('product-image-input').setInputFiles('fixtures/product.png');
      await expect(merchant.locator('img[src*="/uploads/"]').first()).toBeVisible();
      await chooseOption(merchant, 'attribute-attr-demo-home-sofa-material', /棉麻/);
      await merchant.getByTestId('attribute-attr-demo-home-sofa-size').fill('三人位 200cm');
      await merchant.getByTestId('product-sku-code').fill(`${code}-A`);
      await merchant.locator('input[name="skus.0.price"]').fill('199.00');
      await merchant.locator('input[name="skus.0.stock"]').fill('5');
      await merchant.getByRole('button', { name: SAVE_BUTTON }).click();
      await merchant.waitForURL(url => url.pathname === '/products');

      // 2. Submit for review from a freshly loaded detail page.
      await openMerchantProduct(merchant, code);
      await expect(merchant.getByTestId('product-status')).toContainText(/草稿|Draft/);
      await merchant.getByTestId('product-submit').click();
      await merchant.waitForURL(url => url.pathname === '/products');

      // 3. Under review: read-only detail and no Edit action in the list row.
      await openMerchantProduct(merchant, code);
      await expect(merchant.getByTestId('product-status')).toContainText(/审核中|Under review/);
      await expect(merchant.getByTestId('product-submit')).toHaveCount(0);
      await expect(merchant.getByRole('button', { name: SAVE_BUTTON })).toHaveCount(0);

      await searchMerchantProducts(merchant, code);
      const submittedRow = merchant.getByRole('row').filter({ hasText: code });
      await expect(submittedRow.getByRole('button', { name: /查看|View/ })).toBeVisible();
      await expect(submittedRow.getByRole('button', { name: /编辑|Edit/ })).toHaveCount(0);

      // 4. Ops rejects with a reason.
      await searchAudits(ops, code);
      const pendingRow = ops.getByRole('row').filter({ hasText: code });
      await expect(pendingRow).toBeVisible();
      await pendingRow.getByTestId('audit-open').click();
      await expect(ops.getByTestId('audit-status')).toContainText(/待审核|Pending/);
      await ops.getByTestId('audit-comment').fill(rejectReason);
      await ops.getByTestId('audit-reject').click();
      await expect(ops.getByTestId('audit-reject')).toBeHidden();

      // 5. The merchant sees the rejection reason, edits and resubmits.
      await openMerchantProduct(merchant, code);
      await expect(merchant.getByTestId('product-status')).toContainText(/已驳回|Rejected/);
      await expect(merchant.getByRole('alert').filter({ hasText: rejectReason })).toBeVisible();

      await merchant.getByTestId('product-title').fill(`${title} v2`);
      await merchant.getByRole('button', { name: SAVE_BUTTON }).click();
      await merchant.waitForURL(url => url.pathname === '/products');

      await openMerchantProduct(merchant, code);
      await expect(merchant.getByTestId('product-status')).toContainText(/草稿|Draft/);
      await merchant.getByTestId('product-submit').click();
      await merchant.waitForURL(url => url.pathname === '/products');

      // 6. Ops approves the resubmitted version.
      await searchAudits(ops, code, 'PENDING');
      const resubmittedRow = ops.getByRole('row').filter({ hasText: code });
      await expect(resubmittedRow).toBeVisible();
      await resubmittedRow.getByTestId('audit-open').click();
      await ops.getByTestId('audit-approve').click();
      await expect(ops.getByTestId('audit-approve')).toBeHidden();

      // 7. The merchant publishes and the published status is visible on the detail page.
      await openMerchantProduct(merchant, code);
      await expect(merchant.getByTestId('product-status')).toContainText(/已通过|Approved/);
      await merchant.getByTestId('product-publish').click();
      await merchant.waitForURL(url => url.pathname === '/products');

      await openMerchantProduct(merchant, code);
      await expect(merchant.getByTestId('product-status')).toContainText(/已发布|Published/);
    } finally {
      await merchantContext.close();
      await opsContext.close();
    }
  });
});
