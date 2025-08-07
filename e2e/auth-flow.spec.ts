import { test, expect } from './fixtures/base-test';
import { login, logout, ensureLoggedOut, TEST_USER } from './helpers/auth';
import { setupTestUser, waitForApp, createUniqueTestUser } from './helpers/setup';
import { navigateToProtectedRoute } from './helpers/wait-helpers';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state
    await ensureLoggedOut(page);
  });

  test('should show landing page for unauthenticated users', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Should show landing page
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/$/);
    await expect(page.locator('h1:has-text("Your Life,")')).toBeVisible();
    
    // Try to access protected route
    await navigateToProtectedRoute(page, '/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h1, h2, h3').first()).toContainText(/Welcome|Sign in|Login/i);
  });

  test('should login successfully with existing user', async ({ page }) => {
    // Ensure TEST_USER exists
    await setupTestUser(page);
    
    await page.goto('/login');
    await waitForApp(page);
    
    console.log('Before login - URL:', page.url());
    
    // Perform login
    await login(page, TEST_USER.email, TEST_USER.password);
    console.log('Login completed successfully');
    
    console.log('After login - URL:', page.url());
    
    // Should be redirected to main app (dashboard)
    await expect(page).toHaveURL('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the app to fully load and check for the header
    await page.waitForSelector('header', { timeout: 5000 });
    
    // Should see app header with Personal Hub text - using flexible selector
    await expect(page.locator('header').filter({ hasText: 'Personal Hub' })).toBeVisible();
    // Logout button is in dropdown menu, so check for user menu instead
    await expect(page.locator('button').filter({ has: page.locator('.rounded-full') })).toBeVisible();
  });
  
  test('should login successfully with unique user', async ({ page }) => {
    // Create a unique user for this test
    const uniqueUser = await createUniqueTestUser(page);
    
    // Ensure we're logged out before trying to login
    await ensureLoggedOut(page);
    
    console.log('Before login with unique user - URL:', page.url());
    
    // Perform login
    await login(page, uniqueUser.email, uniqueUser.password);
    console.log('Login with unique user completed successfully');
    
    console.log('After login - URL:', page.url());
    
    // Should be redirected to main app (dashboard)
    await expect(page).toHaveURL('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the app to fully load and check for the header
    await page.waitForSelector('header', { timeout: 5000 });
    
    // Should see app header with Personal Hub text - using flexible selector
    await expect(page.locator('header').filter({ hasText: 'Personal Hub' })).toBeVisible();
    // Logout button is in dropdown menu, so check for user menu instead
    await expect(page.locator('button').filter({ has: page.locator('.rounded-full') })).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Create a unique user for this test
    const uniqueUser = await createUniqueTestUser(page);
    
    // Ensure we're logged out before trying to login
    await ensureLoggedOut(page);
    await login(page, uniqueUser.email, uniqueUser.password);
    
    // Wait for app to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('header', { timeout: 5000 });
    await expect(page.locator('header').filter({ hasText: 'Personal Hub' })).toBeVisible();
    
    // Logout
    await logout(page);
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should persist authentication across page reloads', async ({ page }) => {
    // Create a unique user for this test
    const uniqueUser = await createUniqueTestUser(page);
    
    // Ensure we're logged out before trying to login
    await ensureLoggedOut(page);
    await login(page, uniqueUser.email, uniqueUser.password);
    
    // Verify logged in
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('header', { timeout: 5000 });
    await expect(page.locator('header').filter({ hasText: 'Personal Hub' })).toBeVisible();
    
    // Reload page
    await page.reload();
    
    // Wait for reload to complete - don't use waitForApp as it expects unauthenticated state
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for React hydration
    
    // Should still be logged in
    await page.waitForSelector('header', { timeout: 5000 });
    await expect(page.locator('header').filter({ hasText: 'Personal Hub' })).toBeVisible();
    // Logout button is in dropdown menu, so check for user menu instead
    await expect(page.locator('button').filter({ has: page.locator('.rounded-full') })).toBeVisible();
  });
});