import { test, expect } from '@playwright/test';
import { registerAndGoToList } from './helpers';

test.describe('List', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndGoToList(page);
  });

  test('create a new section', async ({ page }) => {
    await page.click('button:has-text("New section")');
    await page.fill('input[placeholder="Section name (e.g. Produce)"]', 'Produce');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Produce')).toBeVisible();
  });

  test('add an item to a section', async ({ page }) => {
    // Create section first
    await page.click('button:has-text("New section")');
    await page.fill('input[placeholder="Section name (e.g. Produce)"]', 'Dairy');
    await page.click('button:has-text("Add")');

    // Add item
    await page.click('text=Add item');
    await page.fill('input[placeholder="Item name"]', 'Milk');
    await page.click('form button:has-text("Add")');
    await expect(page.locator('text=Milk')).toBeVisible();
  });

  test('delete a section', async ({ page }) => {
    await page.click('button:has-text("New section")');
    await page.fill('input[placeholder="Section name (e.g. Produce)"]', 'To Delete');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=To Delete')).toBeVisible();

    await page.click('[title="Delete section"]');
    await expect(page.locator('text=To Delete')).not.toBeVisible();
  });

  test('empty state shows prompt to add section', async ({ page }) => {
    await expect(page.locator('text=Your list is empty')).toBeVisible();
  });
});
