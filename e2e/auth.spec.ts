import { test, expect } from './fixtures/base-test';
import { login, logout, ensureLoggedOut, TEST_USER } from './helpers/auth';
import { setupTestUser, waitForApp, createUniqueTestUser } from './helpers/setup';
import { navigateToProtectedRoute } from './helpers/wait-helpers';
import { browserHelpers } from './helpers/browser-specific';

/**
 * Comprehensive Authentication E2E Tests
 * Consolidated from: auth.spec.ts, auth-improved.spec.ts, auth-basic.spec.ts, 
 * auth-e2e.spec.ts, auth-flow.spec.ts, simple-auth.spec.ts
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Ensure clean state
    await ensureLoggedOut(page);
    
    // Set up console handling for improved tests
    browserHelpers.setupConsoleHandling(page, browserName);
  });

  test.describe('Landing Page', () => {
    test('should display landing page for unauthenticated users', async ({ page }) => {
      // Navigate to home page
      await page.goto('/');
      
      // Should show landing page
      await expect(page).toHaveURL(/^http:\/\/localhost:3000\/$/);
      await expect(page.getByRole('heading', { name: 'Your Life,', level: 1 })).toBeVisible();
      await expect(page.locator('text=Transform chaos into clarity')).toBeVisible();
      
      // Check for auth navigation links
      await expect(page.locator('nav a[href="/login"]')).toBeVisible();
      await expect(page.locator('a[href="/register"]', { hasText: 'Get Started' })).toBeVisible();
    });

    test('should redirect to login when accessing protected routes', async ({ page }) => {
      // Try to access protected route
      await navigateToProtectedRoute(page, '/dashboard');
      
      // Should be redirected to login
      await expect(page).toHaveURL(/.*\/login/);
      await expect(page.locator('h1, h2, h3').first()).toContainText(/Welcome|Sign in|Login/i);
    });
  });

  test.describe('Login Page', () => {
    test('should display login page with proper elements', async ({ page, browserName }) => {
      // Navigate with browser-specific handling
      await browserHelpers.navigateWithBrowserHandling(page, '/login', browserName);
      
      // Should be on login page
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
      
      // Wait for form elements with browser-specific timeouts
      await browserHelpers.waitForElement(page, 'form', browserName);
      
      // Check for login form elements with flexible selectors
      const emailInput = page.locator('input[type="email"]').or(page.locator('input[name="email"]')).first();
      const passwordInput = page.locator('input[type="password"]').or(page.locator('input[name="password"]')).first();
      const submitButton = page.locator('button[type="submit"]').first();
      
      await expect(emailInput).toBeVisible({ timeout: 5000 });
      await expect(passwordInput).toBeVisible({ timeout: 5000 });
      await expect(submitButton).toBeVisible({ timeout: 5000 });
      
      // Check for login heading
      await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
      
      // Check for register link with flexible selector
      const registerLink = page.locator('a[href="/register"]').or(page.locator('a:text-matches("register", "i")')).or(page.locator('a:text-matches("sign up", "i")')).first();
      await expect(registerLink).toBeVisible({ timeout: 5000 });
    });

    test('should handle invalid login credentials', async ({ page, browserName }) => {
      await browserHelpers.navigateWithBrowserHandling(page, '/login', browserName);
      
      // Fill in invalid credentials with browser-specific handling
      await browserHelpers.fillFormField(page, 'input[type="email"]', 'invalid@example.com', browserName);
      await browserHelpers.fillFormField(page, 'input[type="password"]', 'wrongpassword', browserName);
      
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      
      // Wait for response with longer timeout for slower browsers
      const responseTimeout = browserName === 'webkit' ? 20000 : 10000;
      await page.waitForLoadState('networkidle', { timeout: responseTimeout });
      
      // Look for error indication with flexible selectors
      const errorIndicators = [
        page.locator('div[role="alert"]'),                    // Toast notifications
        page.locator('.error, .alert, .alert-error'),         // Common error classes
        page.locator('*:text-matches("error", "i")'),         // Any element with "error" text
        page.locator('*:text-matches("invalid", "i")'),       // Any element with "invalid" text
        page.locator('*:text-matches("failed", "i")'),        // Any element with "failed" text
      ];
      
      // Check if any error indicator is visible
      let errorFound = false;
      for (const indicator of errorIndicators) {
        try {
          await indicator.first().waitFor({ state: 'visible', timeout: 5000 });
          errorFound = true;
          break;
        } catch {
          // Continue checking other indicators
        }
      }
      
      // Alternative: check if still on login page (login failed)
      if (!errorFound) {
        await expect(page).toHaveURL(/\/login/);
      }
    });
  });

  test.describe('Registration Page', () => {
    test('should navigate between login and register', async ({ page, browserName }) => {
      await browserHelpers.navigateWithBrowserHandling(page, '/login', browserName);
      
      // Find and click register link with flexible selector
      const registerLink = page.locator('a[href="/register"]').or(page.locator('a:text-matches("register", "i")')).or(page.locator('a:text-matches("sign up", "i")')).or(page.locator('a:text-matches("create account", "i")')).first();
      
      await registerLink.waitFor({ state: 'visible', timeout: 5000 });
      await registerLink.click();
      
      // Wait for navigation
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      
      // Verify on register page
      await expect(page).toHaveURL(/\/register/);
      
      // Verify register form is visible
      const registerForm = page.locator('form');
      await expect(registerForm).toBeVisible({ timeout: 5000 });
      
      // Go back to login
      try {
        await page.getByRole('link', { name: 'Login' }).click();
      } catch {
        // Fallback: try href attribute
        await page.click('a[href="/login"]');
      }
      
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Authentication Flow', () => {
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
      
      // Should see app header with Personal Hub text
      await expect(page.locator('header').filter({ hasText: 'Personal Hub' })).toBeVisible();
      // Check for user menu (logout button is in dropdown menu)
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
      
      // Should see app header with Personal Hub text
      await expect(page.locator('header').filter({ hasText: 'Personal Hub' })).toBeVisible();
      // Check for user menu
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
      
      // Wait for reload to complete
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Wait for React hydration
      
      // Should still be logged in
      await page.waitForSelector('header', { timeout: 5000 });
      await expect(page.locator('header').filter({ hasText: 'Personal Hub' })).toBeVisible();
      // Check for user menu
      await expect(page.locator('button').filter({ has: page.locator('.rounded-full') })).toBeVisible();
    });
  });

  test.describe('Mobile and Cross-browser', () => {
    test('should handle mobile interactions', async ({ page, browserName, isMobile }) => {
      // Navigate directly to login
      await browserHelpers.navigateWithBrowserHandling(page, '/login', browserName);
      
      // Handle mobile-specific interactions
      await browserHelpers.handleMobileInteraction(page, isMobile);
      
      // Fill form with browser-specific handling
      await browserHelpers.fillFormField(page, 'input[type="email"]', 'test@example.com', browserName);
      await browserHelpers.fillFormField(page, 'input[type="password"]', 'testpassword', browserName);
      
      // Submit form
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      
      // Wait for response with longer timeout for slower browsers
      const responseTimeout = browserName === 'webkit' ? 20000 : 10000;
      await page.waitForLoadState('networkidle', { timeout: responseTimeout });
      
      // Check result - either redirected or showing error
      const currentUrl = page.url();
      const isOnLoginPage = currentUrl.includes('/login');
      const isOnDashboard = currentUrl.includes('/dashboard') || currentUrl.includes('/todos');
      
      expect(isOnLoginPage || isOnDashboard).toBeTruthy();
    });
  });

  test.describe('Locale and Internationalization', () => {
    test('should handle English locale properly', async ({ page }) => {
      // Set language preference
      await page.evaluate(() => {
        localStorage.setItem('i18nextLng', 'en');
      });
      
      await page.goto('/login');
      
      // Reload to ensure i18n is initialized with English
      await page.reload();
      
      // Wait for form to be ready
      await page.waitForLoadState('networkidle');
      
      // Check form elements are visible with English text
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    });
  });
});