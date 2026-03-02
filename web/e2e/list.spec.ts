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

test.describe('List', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('create a new section', async ({ page }) => {
    await page.click('button:has-text("+ New section")');
    await page.fill('input[placeholder="Section name (e.g. Produce)"]', 'Produce');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Produce')).toBeVisible();
  });

  test('add an item to a section', async ({ page }) => {
    // Create section first
    await page.click('button:has-text("+ New section")');
    await page.fill('input[placeholder="Section name (e.g. Produce)"]', 'Dairy');
    await page.click('button:has-text("Add")');

    // Add item
    await page.click('button:has-text("Add item")');
    await page.fill('input[placeholder*="item"]', 'Milk');
    await page.keyboard.press('Enter');
    await expect(page.locator('text=Milk')).toBeVisible();
  });

  test('delete a section', async ({ page }) => {
    await page.click('button:has-text("+ New section")');
    await page.fill('input[placeholder="Section name (e.g. Produce)"]', 'To Delete');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=To Delete')).toBeVisible();

    // Open section menu and delete
    await page.locator('text=To Delete').hover();
    await page.click('[aria-label="Delete section"]');
    await expect(page.locator('text=To Delete')).not.toBeVisible();
  });

  test('empty state shows prompt to add section', async ({ page }) => {
    await expect(page.locator('text=Your list is empty')).toBeVisible();
  });
});
