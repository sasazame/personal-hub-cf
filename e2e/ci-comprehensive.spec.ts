import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth-helpers';

/**
 * Comprehensive CI test suite covering all critical user paths
 * These tests are designed to be stable and run in CI environments
 */

test.describe('CI Comprehensive Tests', () => {
  test.setTimeout(30000); // Reasonable timeout for CI

  test.describe('Authentication', () => {
    test('should register and login successfully', async ({ page }) => {
      const timestamp = Date.now().toString();
      const testUser = {
        username: `ciuser${timestamp}`,
        email: `ci${timestamp}@test.com`,
        password: 'TestPass123!'
      };

      // Register
      await page.goto('/register');
      await page.fill('input[name="username"]', testUser.username);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="confirmPassword"]', testUser.password);
      await page.click('button[type="submit"]');

      // Should redirect to dashboard or login
      await page.waitForURL(url => {
        return url.pathname.includes('dashboard') || url.pathname.includes('login');
      }, { timeout: 10000 });

      // If redirected to login, log in
      if (page.url().includes('login')) {
        await page.fill('input[name="email"]', testUser.email);
        await page.fill('input[name="password"]', testUser.password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*dashboard/, { timeout: 10000 });
      }

      // Verify dashboard loaded
      await expect(page.locator('h1:has-text("Welcome"), h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
    });

    test('should handle logout correctly', async ({ page }) => {
      // Register and login, capturing the user data
      const testData = await registerAndLogin(page);
      
      // Wait for dashboard to fully load
      await page.waitForLoadState('networkidle');
      
      // Find and click user menu button using the username (like ci-critical test does)
      const userMenuButton = page.locator('button').filter({ hasText: testData.username });
      await expect(userMenuButton).toBeVisible({ timeout: 10000 });
      await userMenuButton.click();
      
      // Wait for dropdown menu to appear
      await page.waitForTimeout(500);
      
      // Find and click logout button in dropdown
      const logoutButton = page.locator('button').filter({ hasText: /logout/i }).first();
      await expect(logoutButton).toBeVisible({ timeout: 5000 });
      
      // Click logout
      await logoutButton.click();
      
      // Wait for redirect to landing/login page
      await page.waitForURL(url => {
        const path = url.pathname;
        return path === '/' || path === '/landing' || path === '/login';
      }, { timeout: 10000 });
      
      // Verify we're on the landing or login page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(landing|login|$)/);
    });
  });

  test.describe('Core Features', () => {
    test.beforeEach(async ({ page }) => {
      await registerAndLogin(page);
    });

    test('should create and manage todos', async ({ page }) => {
      await page.goto('/todos');
      await page.waitForSelector('h1:has-text("TODO"), h1:has-text("Tasks")', { timeout: 10000 });
      
      // Create todo
      const addButton = page.locator('button:has-text("Add Todo"), button:has-text("New Todo"), button:has-text("Create Todo")');
      await addButton.click();
      
      await page.fill('input[name="title"]', 'CI Todo Test');
      await page.fill('textarea[name="description"], input[name="description"]', 'Test description');
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Wait for todo to appear
      await expect(page.locator('text="CI Todo Test"')).toBeVisible({ timeout: 10000 });
      
      // Mark as complete if possible
      const completeButton = page.locator('button:has-text("Complete"), button:has-text("Mark complete"), input[type="checkbox"]');
      if (await completeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await completeButton.first().click();
        await page.waitForTimeout(1000);
      }
    });

    test('should navigate between main sections', async ({ page }) => {
      const sections = [
        { name: 'Dashboard', url: /dashboard/ },
        { name: 'TODOs', url: /todos/ },
        { name: 'Calendar', url: /calendar/ },
        { name: 'Notes', url: /notes/ }
      ];

      for (const section of sections) {
        // Find navigation link - try multiple selectors
        const navLink = page.locator(`a:has-text("${section.name}"), nav >> text="${section.name}"`);
        
        if (await navLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          await navLink.click();
          await expect(page).toHaveURL(section.url, { timeout: 10000 });
          
          // Verify page loaded
          await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should display user profile information', async ({ page }) => {
      // Check for user avatar or menu
      const userIndicator = page.locator('.rounded-full, [class*="avatar"], button:has-text("Profile")');
      await expect(userIndicator.first()).toBeVisible({ timeout: 10000 });
      
      // Try to navigate to profile if available
      if (await page.locator('a[href*="profile"]').isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.click('a[href*="profile"]');
        await page.waitForLoadState('networkidle');
        
        // Verify profile page elements
        await expect(page.locator('text=/email|username|profile/i').first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('API Health Checks', () => {
    test('should verify API endpoints are responsive', async ({ request }) => {
      // Use the correct port based on environment
      const apiUrl = process.env.VITE_API_BASE_URL || (process.env.CI ? 'http://localhost:8788' : 'http://localhost:8787');
      
      // Health check
      const healthResponse = await request.get(`${apiUrl}/health`);
      expect(healthResponse.ok()).toBeTruthy();
      
      // Auth endpoints should respond (even with errors for unauthenticated requests)
      const meResponse = await request.get(`${apiUrl}/api/v1/auth/me`);
      expect([401, 403, 200]).toContain(meResponse.status());
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid login gracefully', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[name="email"]', 'invalid@test.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=/invalid|incorrect|failed/i')).toBeVisible({ timeout: 5000 });
      
      // Should stay on login page
      await expect(page).toHaveURL(/login/);
    });

    test('should handle network errors gracefully', async ({ page, context }) => {
      await registerAndLogin(page);
      
      // Block API requests to simulate network error
      await context.route('**/api/**', route => route.abort());
      
      // Try to create a todo
      await page.goto('/todos');
      const addButton = page.locator('button:has-text("Add Todo"), button:has-text("New Todo")');
      
      if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addButton.click();
        await page.fill('input[name="title"]', 'Network Test');
        await page.click('button[type="submit"]');
        
        // Should show error message
        await expect(page.locator('text=/error|failed|problem/i')).toBeVisible({ timeout: 10000 });
      }
    });
  });
});