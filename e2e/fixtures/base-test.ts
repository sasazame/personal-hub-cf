import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

// Define test user credentials
export const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123!',
  username: 'testuser',
};

// Extend the base test with custom fixtures
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  // Create an authenticated page fixture
  authenticatedPage: async ({ page, context }, use) => {
    // Clear all storage to ensure clean state
    await context.clearCookies();
    
    // Navigate to the app first
    await page.goto('/');
    
    // Then clear storage if possible
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (error) {
      // Storage might not be accessible yet
      console.log('Could not clear storage:', error);
    }

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