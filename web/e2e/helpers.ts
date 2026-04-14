import { expect, type Page } from '@playwright/test';

/**
 * Register a new account and skip onboarding to land on /list.
 * Used as a shared setup step across E2E tests.
 */
export async function registerAndGoToList(page: Page) {
  const email = `test-${Date.now()}@example.com`;
  await page.goto('/register');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/onboarding');
  await page.click('button:has-text("Skip for now")');
  await expect(page).toHaveURL('/list');
}
