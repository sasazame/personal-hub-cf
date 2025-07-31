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
    
    // Navigate to a page before trying to clear storage
    page.on('load', async () => {
      // Clear storage after page loads
      await page.evaluate(() => {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.clear();
          }
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
          }
        } catch (e) {
          // Ignore errors if storage is not accessible
        }
      }).catch(() => {
        // Ignore errors
      });
    });
    
    // Use the fixture
    await use();
  }, { auto: true }]
});

export { expect } from '@playwright/test';