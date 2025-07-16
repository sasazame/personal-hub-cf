import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

// Define test user credentials from environment or use defaults
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'Password123!',
  username: process.env.TEST_USER_USERNAME || 'testuser',
};

// Extend the base test with custom fixtures
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  // Create an authenticated page fixture
  authenticatedPage: async ({ page, context }, use) => {
    // Clear all storage to ensure clean state
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate to login page
    await page.goto('/login');
    
    // Fill in login form
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/');
    
    // Use the authenticated page in the test
    await use(page);
    
    // Cleanup after test
    await context.clearCookies();
  },
});

export { expect } from '@playwright/test';