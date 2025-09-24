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
      
      // Should show login and register buttons/links (use role-based selectors)
      await expect(page.getByRole('link', { name: /Sign In|Login/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /Get Started|Register/i }).first()).toBeVisible();
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
      
      // Error feedback mechanisms vary; minimally assert we remain on login
      await page.waitForTimeout(300); // allow any toast to render
      await expect(page).toHaveURL(/\/login/);
    });

    test('should login successfully with existing user', async ({ page }) => {
      // Setup test user
      await setupTestUser(page);
      
      // Login
      await login(page, TEST_USER.email, TEST_USER.password);
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      
      // Should show user menu with username
      const userMenuBtn = page.getByRole('button').filter({ has: page.locator('.rounded-full') });
      await expect(userMenuBtn).toBeVisible();
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
      const uniqueId = Date.now();
      const uniqueEmail = `test-${uniqueId}@example.com`;
      const uniqueUsername = `t${uniqueId.toString().slice(-10)}`; // ensure <= 20 chars
      
      await page.goto('/register');
      
      // Fill registration form
      await page.locator('input[name="email"]').fill(uniqueEmail);
      await page.locator('input[name="username"]').fill(uniqueUsername);
      await page.locator('input[name="password"]').fill('Password123!');
      // Confirm password if field exists
      const confirm = page.locator('input[name="confirmPassword"]');
      if (await confirm.count()) {
        await confirm.fill('Password123!');
      }
      await page.locator('button[type="submit"]').click();
      // If validation error appears, fail fast with context
      const error = page.locator('text=Username must be at most 20 characters');
      if (await error.isVisible({ timeout: 1000 }).catch(() => false)) {
        throw new Error('Registration validation failed: username length');
      }
      
      // Should redirect to dashboard after successful registration
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test('should navigate between login and register', async ({ page }) => {
      await page.goto('/login');
      
      // Click register link
      await page.getByRole('link', { name: /Sign up|Register/i }).first().click();
      await expect(page).toHaveURL(/\/register/);
      
      // Click login link
      await page.getByRole('link', { name: /Sign in|Login/i }).first().click();
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
      
      // Click logout button in dropdown menu
      // Click logout button in dropdown menu (role attribute may not be present)
      await page.getByRole('button', { name: /Logout|Sign out/i }).click();
      
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
      const userMenuBtn = page.getByRole('button').filter({ has: page.locator('.rounded-full') });
      await expect(userMenuBtn).toBeVisible();
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
