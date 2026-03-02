import { test, expect, type Page } from '@playwright/test';

async function registerAndLogin(page: Page) {
  const email = `test-${Date.now()}@example.com`;
  await page.goto('/register');
  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/list');
}

test.describe('AI Panel', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('open and close the AI panel', async ({ page }) => {
    await page.click('button:has-text("✨ AI")');
    await expect(page.locator('aside')).toBeVisible();

    await page.click('button:has-text("✨ AI")');
    await expect(page.locator('aside')).not.toBeVisible();
  });

  test('AI panel is visible after opening', async ({ page }) => {
    await page.click('button:has-text("✨ AI")');
    const aside = page.locator('aside');
    await expect(aside).toBeVisible();
  });
});
