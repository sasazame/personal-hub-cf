import { test, expect } from './fixtures/base-test-real-backend';
import { ensureLoggedOut, login, TEST_USER } from './helpers/auth';

test.describe('Auth E2E Tests (Real Backend)', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('should show landing page when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should be on landing page
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // Should see landing page content
    await expect(page.getByRole('heading', { name: /Your Life,/i, level: 1 })).toBeVisible();
    await expect(page.locator('a').filter({ hasText: 'Get Started' })).toBeVisible();
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    
    // Check form elements are visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for page to load
    await page.getByRole('heading', { name: 'Login', level: 1 }).waitFor({ timeout: 5000 });
    
    // Click register link
    await page.getByRole('link', { name: 'Register' }).click();
    
    await expect(page).toHaveURL(/\/register/);
    
    // Go back to login
    await page.getByRole('link', { name: 'Login' }).click();
    
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show registration form', async ({ page }) => {
    await page.goto('/register');
    
    // Check form elements are visible
    await expect(page.locator('input[placeholder="Please enter your username"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Please enter your email address"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
  });

  // Note: Actual login tests would require creating test users in the database
  // For now, we're just testing the UI behavior
});