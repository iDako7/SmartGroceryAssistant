import { test, expect } from '@playwright/test';
import { registerAndGoToList } from './helpers';

test.describe('AI Panel', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndGoToList(page);
  });

  test('open and close the AI panel', async ({ page }) => {
    await page.click('button:has-text("AI")');
    await expect(page.locator('aside')).toBeVisible();

    await page.click('button:has-text("AI")');
    await expect(page.locator('aside')).not.toBeVisible();
  });

  test('AI panel shows tabs', async ({ page }) => {
    await page.click('button:has-text("AI")');
    await expect(page.locator('text=Info')).toBeVisible();
    await expect(page.locator('text=Translate')).toBeVisible();
    await expect(page.locator('text=Alternatives')).toBeVisible();
    await expect(page.locator('text=Suggest')).toBeVisible();
  });
});
