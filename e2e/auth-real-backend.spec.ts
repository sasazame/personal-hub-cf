import { test, expect } from './fixtures/base-test-real-backend';
import { ensureLoggedOut, login, TEST_USER } from './helpers/auth';

test.describe('Auth E2E Tests (Real Backend)', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Wait for redirect to complete
    await page.waitForURL('**/login**', { timeout: 10000 });
    
    // Should be on login page
    await expect(page).toHaveURL(/.*\/login/);
    
    // Should see login form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
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
    await page.waitForSelector('h1:has-text("Login")', { timeout: 10000 });
    
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