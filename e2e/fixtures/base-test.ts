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

    // Navigate to home page (will show login form when not authenticated)
    await page.goto('/');
    
    // Wait for login form to be visible
    await page.waitForSelector('form', { state: 'visible', timeout: 5000 });
    
    // Fill in login form with more specific selectors
    // Using form context and ID attributes for better reliability
    await page.fill('form input#email', TEST_USER.email);
    await page.fill('form input#password', TEST_USER.password);
    
    // Click the submit button within the form
    await page.click('form button[type="submit"]');
    
    // Wait for redirect to dashboard with timeout and error handling
    try {
      await page.waitForURL('/', { 
        timeout: 10000, // 10 second timeout
        waitUntil: 'networkidle' 
      });
    } catch (error) {
      // Check if we're still showing the login form
      const loginFormVisible = await page.isVisible('form input#email').catch(() => false);
      if (loginFormVisible) {
        // Look for error messages on the page
        const errorMessage = await page.textContent('.text-destructive').catch(() => null);
        throw new Error(
          `Login failed. Login form still visible. ${
            errorMessage ? `Error: ${errorMessage}` : 'No error message found.'
          } Please check credentials and ensure test user exists.`
        );
      }
      // Re-throw if it's a different error
      throw new Error(`Failed to navigate to dashboard after login: ${error}`);
    }
    
    // Verify we're actually authenticated by checking for logout button
    try {
      await page.waitForSelector('button:has-text("Logout")', { 
        timeout: 5000,
        state: 'visible' 
      });
    } catch {
      throw new Error('Login appeared successful but logout button not found. Authentication may have failed.');
    }
    
    // Use the authenticated page in the test
    await use(page);
    
    // Cleanup after test
    await context.clearCookies();
  },
});

export { expect } from '@playwright/test';