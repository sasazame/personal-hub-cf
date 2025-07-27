import { test as base, Page, BrowserContext } from '@playwright/test';

// Define custom fixtures type
type CustomFixtures = {
  autoSetup: void;
};

// Extend the base test with custom fixtures
export const test = base.extend<CustomFixtures>({
  // Auto-fixture that runs before each test
  autoSetup: [async ({ page, context }: { page: Page; context: BrowserContext }, use: () => Promise<void>) => {
    // Clear cookies first
    await context.clearCookies();
    
    // Set default locale
    await context.addCookies([{ 
      name: 'locale', 
      value: 'en', 
      domain: 'localhost', 
      path: '/' 
    }]);
    
    // Navigate to a page before clearing storage to avoid security errors
    await page.goto('/login');
    
    // Clear all storage to ensure test isolation
    await page.evaluate(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    });
    
    // Use the fixture
    await use();
  }, { auto: true }]
});

export { expect } from '@playwright/test';