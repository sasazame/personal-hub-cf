import { test, expect, TEST_USER } from './fixtures/base-test';

test.describe('Setup Test User', () => {
  test('should create test user if not exists', async ({ page }) => {
    // Try to go to the home page
    await page.goto('/');
    
    // Check if we're already logged in or need to register
    const isLoginPage = await page.isVisible('form input#email', { timeout: 3000 }).catch(() => false);
    
    if (isLoginPage) {
      // Try to switch to register
      const hasRegisterLink = await page.locator('text=Don\'t have an account').isVisible().catch(() => false);
      
      if (hasRegisterLink) {
        await page.click('text=Don\'t have an account');
      }
      
      // Fill registration form
      await page.fill('input#email', TEST_USER.email);
      await page.fill('input#password', TEST_USER.password);
      
      // Check if username field exists (registration form)
      const hasUsernameField = await page.locator('input#username').isVisible().catch(() => false);
      
      if (hasUsernameField) {
        await page.fill('input#username', TEST_USER.username);
        await page.click('button[type="submit"]:has-text("Register")');
        
        // Wait for registration to complete
        await page.waitForURL('/', { timeout: 10000 }).catch(() => {
          // Registration might have failed - user might already exist
          console.log('Registration failed, user might already exist');
        });
      } else {
        // We're on login page, try to login
        await page.click('button[type="submit"]:has-text("Log in")');
        
        // Check if login succeeded
        await page.waitForURL('/', { timeout: 5000 }).catch(() => {
          console.log('Login failed, user might not exist');
          throw new Error('Test user does not exist. Please create it manually.');
        });
      }
    }
    
    // Verify we can see the dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Logout to prepare for actual tests
    await page.click('button:has-text("Logout")');
    
    console.log('Test user setup completed successfully');
  });
});