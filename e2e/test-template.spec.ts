/**
 * E2E Test Template
 * 
 * This file serves as a template for writing resilient E2E tests.
 * Follow these best practices:
 * 
 * 1. Always wait for network idle state after navigation
 * 2. Use explicit waits instead of fixed timeouts
 * 3. Prefer data-testid attributes over complex selectors
 * 4. Handle both success and error cases
 * 5. Take screenshots on failures for debugging
 * 6. Use page.waitForLoadState() after actions that trigger navigation
 */

import { test, expect, Page } from '@playwright/test';

// Helper functions for common operations
const helpers = {
  /**
   * Navigate to a page and wait for it to be fully loaded
   */
  async navigateTo(page: Page, url: string) {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
  },

  /**
   * Fill a form field with retry logic
   */
  async fillField(page: Page, selector: string, value: string) {
    const field = page.locator(selector);
    await field.waitFor({ state: 'visible' });
    await field.fill(value);
  },

  /**
   * Click a button/link with retry logic
   */
  async clickElement(page: Page, selector: string) {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible' });
    await element.click();
  },

  /**
   * Wait for and verify toast notification
   */
  async expectToast(page: Page, type: 'success' | 'error') {
    // React Hot Toast uses role="alert" for notifications
    const toast = page.locator('div[role="alert"]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    
    // Optionally verify toast type by checking classes or content
    if (type === 'error') {
      // Toast might have error-specific styling
      await expect(toast).toContainText(/error|failed|invalid/i);
    }
  },

  /**
   * Check if user is authenticated by looking for auth-only elements
   */
  async expectAuthenticated(page: Page) {
    // Look for elements that only appear when logged in
    // Update selector based on your app's structure
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  },

  /**
   * Take a screenshot with descriptive name
   */
  async screenshot(page: Page, name: string) {
    await page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }
};

// Example test structure
test.describe('Feature Name', () => {
  // Run before each test
  test.beforeEach(async ({ page }) => {
    // Set up any required state
    // e.g., clear cookies, local storage, etc.
    await page.context().clearCookies();
  });

  test('should perform basic action', async ({ page }) => {
    // 1. Navigate to the page
    await helpers.navigateTo(page, '/');

    // 2. Perform actions
    await helpers.fillField(page, 'input[type="email"]', 'test@example.com');
    await helpers.fillField(page, 'input[type="password"]', 'password123');
    await helpers.clickElement(page, 'button[type="submit"]');

    // 3. Wait for response
    await page.waitForLoadState('networkidle');

    // 4. Assert results
    await expect(page).toHaveURL(/\/dashboard/);
    await helpers.expectAuthenticated(page);
  });

  test('should handle error case', async ({ page }) => {
    await helpers.navigateTo(page, '/login');

    // Submit invalid data
    await helpers.fillField(page, 'input[type="email"]', 'invalid@example.com');
    await helpers.fillField(page, 'input[type="password"]', 'wrongpassword');
    await helpers.clickElement(page, 'button[type="submit"]');

    // Wait for error response
    await page.waitForLoadState('networkidle');

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Take screenshot for debugging
    await helpers.screenshot(page, 'login-error');
  });

  test('should work with data-testid attributes', async ({ page }) => {
    await helpers.navigateTo(page, '/');

    // Prefer data-testid over complex selectors
    await page.locator('[data-testid="email-input"]').fill('user@example.com');
    await page.locator('[data-testid="password-input"]').fill('password');
    await page.locator('[data-testid="login-button"]').click();

    // Wait and verify
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
  });
});

// Browser-specific test example
test.describe('Browser-specific tests', () => {
  test('should handle browser differences', async ({ page, browserName }) => {
    await helpers.navigateTo(page, '/');

    if (browserName === 'firefox') {
      // Firefox-specific handling
      await page.waitForTimeout(1000); // Sometimes Firefox needs extra time
    }

    if (browserName === 'webkit') {
      // Safari-specific handling
      // Safari might handle certain features differently
    }

    // Common test logic
    await expect(page.locator('h1')).toBeVisible();
  });
});

// Mobile-specific test example
test.describe('Mobile tests', () => {
  test('should work on mobile viewport', async ({ page, isMobile }) => {
    await helpers.navigateTo(page, '/');

    if (isMobile) {
      // Mobile-specific actions
      // e.g., open hamburger menu
      await page.locator('[data-testid="mobile-menu-button"]').click();
    }

    // Rest of the test
    await expect(page.locator('nav')).toBeVisible();
  });
});

export { helpers };