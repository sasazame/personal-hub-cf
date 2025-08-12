import { test, expect } from '@playwright/test';
import { login, ensureLoggedOut, TEST_USER } from './helpers/auth';
import { setupTestUser } from './helpers/setup';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state for each test
    await ensureLoggedOut(page);
  });

  test.describe('Landing Page', () => {
    test('should display landing page for unauthenticated users', async ({ page }) => {
      await page.goto('/');
      
      // Should redirect to landing page
      await expect(page).toHaveURL(/\/(landing)?$/);
      
      // Should show login and register buttons
      await expect(page.locator('text=Login')).toBeVisible();
      await expect(page.locator('text=Register')).toBeVisible();
    });

    test('should redirect to login when accessing protected routes', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('form')).toBeVisible();
    });
  });

  test.describe('Login', () => {
    test('should display login page with proper elements', async ({ page }) => {
      await page.goto('/login');
      
      // Check form elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('text=Don\'t have an account?')).toBeVisible();
    });

    test('should handle invalid login credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Try to login with invalid credentials
      await page.locator('input[type="email"]').fill('invalid@example.com');
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();
      
      // Should stay on login page
      await expect(page).toHaveURL(/\/login/);
      
      // Should show error message (check for toast or inline error)
      const errorVisible = await page.locator('[data-sonner-toast][data-type="error"], .text-red-500, .text-red-600')
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      
      expect(errorVisible).toBeTruthy();
    });

    test('should login successfully with existing user', async ({ page }) => {
      // Setup test user
      await setupTestUser(page);
      
      // Login
      await login(page, TEST_USER.email, TEST_USER.password);
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      
      // Should show user info in header
      await expect(page.locator('text=' + TEST_USER.email)).toBeVisible();
    });
  });

  test.describe('Registration', () => {
    test('should display registration page with proper elements', async ({ page }) => {
      await page.goto('/register');
      
      // Check form elements
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="username"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('text=Already have an account?')).toBeVisible();
    });

    test('should register and login new user', async ({ page }) => {
      const uniqueEmail = `test-${Date.now()}@example.com`;
      
      await page.goto('/register');
      
      // Fill registration form
      await page.locator('input[name="email"]').fill(uniqueEmail);
      await page.locator('input[name="username"]').fill('testuser');
      await page.locator('input[name="password"]').fill('Password123!');
      await page.locator('button[type="submit"]').click();
      
      // Should redirect to dashboard after successful registration
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test('should navigate between login and register', async ({ page }) => {
      await page.goto('/login');
      
      // Click register link
      await page.locator('text=Don\'t have an account?').locator('..').locator('a').click();
      await expect(page).toHaveURL(/\/register/);
      
      // Click login link
      await page.locator('text=Already have an account?').locator('..').locator('a').click();
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Session Management', () => {
    test('should logout successfully', async ({ page }) => {
      // Setup and login
      await setupTestUser(page);
      await login(page, TEST_USER.email, TEST_USER.password);
      await expect(page).toHaveURL(/\/dashboard/);
      
      // Logout
      const userMenu = page.locator('button').filter({ has: page.locator('.rounded-full') });
      await userMenu.click();
      
      // Click logout button (last button in dropdown)
      const logoutButton = page.locator('button').filter({ hasText: /logout|sign out/i }).last();
      await logoutButton.click();
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should persist authentication across page reloads', async ({ page }) => {
      // Setup and login
      await setupTestUser(page);
      await login(page, TEST_USER.email, TEST_USER.password);
      await expect(page).toHaveURL(/\/dashboard/);
      
      // Reload page
      await page.reload();
      
      // Should still be on dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('text=' + TEST_USER.email)).toBeVisible();
    });
  });
});

// Smoke tests for CI - minimal set of critical tests
test.describe('Auth Smoke Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible({ timeout: 5000 });
  });

  test('should handle basic login flow', async ({ page }) => {
    await setupTestUser(page);
    await page.goto('/login');
    
    // Quick login check
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    
    // Should navigate away from login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
  });
});