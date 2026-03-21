import { test, expect } from '@playwright/test';

const uniqueEmail = () => `test-${Date.now()}@example.com`;

test.describe('Auth', () => {
  test('register a new account and land on /list', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', uniqueEmail());
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/list');
  });

  test('login with existing account and land on /list', async ({ page }) => {
    const email = uniqueEmail();

    // Register first
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/list');

    // Logout
    await page.click('button:has-text("Sign out")');
    await expect(page).toHaveURL('/login');

    // Login again
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/list');
  });

  test('wrong password shows error', async ({ page }) => {
    const email = uniqueEmail();

    await page.goto('/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/list');

    await page.click('button:has-text("Sign out")');

    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('p.text-red-500')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated visit to /list redirects to /login', async ({ page }) => {
    await page.goto('/list');
    await expect(page).toHaveURL('/login');
  });

  test('logout redirects to /login', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', uniqueEmail());
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/list');

    await page.click('button:has-text("Sign out")');
    await expect(page).toHaveURL('/login');
  });
});
