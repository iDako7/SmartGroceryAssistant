import { test, expect } from '@playwright/test';

const uniqueEmail = () => `test-${Date.now()}@example.com`;

test.describe('Auth', () => {
  test('register a new account and land on /onboarding', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="email"]', uniqueEmail());
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/onboarding');
  });

  test('login with existing account and land on /list', async ({ page }) => {
    const email = uniqueEmail();

    // Register first
    await page.goto('/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/onboarding');

    // Skip onboarding
    await page.click('button:has-text("Skip for now")');
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

    // Register
    await page.goto('/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/onboarding');

    // Skip onboarding and logout
    await page.click('button:has-text("Skip for now")');
    await page.click('button:has-text("Sign out")');

    // Login with wrong password
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
    await page.fill('input[name="email"]', uniqueEmail());
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/onboarding');

    await page.click('button:has-text("Skip for now")');
    await expect(page).toHaveURL('/list');

    await page.click('button:has-text("Sign out")');
    await expect(page).toHaveURL('/login');
  });
});
