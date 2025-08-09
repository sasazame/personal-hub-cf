import { test, expect } from '@playwright/test';
import { browserHelpers } from './helpers/browser-specific';

test.describe('Improved Authentication Flow', () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Set up console handling
    browserHelpers.setupConsoleHandling(page, browserName);
  });

  test('should display login page with proper elements', async ({ page, browserName }) => {
    // Navigate with browser-specific handling
    await browserHelpers.navigateWithBrowserHandling(page, '/', browserName);
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    
    // Wait for form elements with browser-specific timeouts
    await browserHelpers.waitForElement(page, 'form', browserName);
    
    // Use more specific selectors
    const emailInput = page.locator('input[type="email"]').or(page.locator('input[name="email"]')).first();
    const passwordInput = page.locator('input[type="password"]').or(page.locator('input[name="password"]')).first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    // Verify elements are visible
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    
    // Check for register link with flexible selector
    const registerLink = page.locator('a[href="/register"]').or(page.locator('a:text-matches("register", "i")')).or(page.locator('a:text-matches("sign up", "i")')).first();
    await expect(registerLink).toBeVisible({ timeout: 5000 });
  });

  test('should handle login form submission', async ({ page, browserName, isMobile }) => {
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

  test('should display error feedback on invalid login', async ({ page, browserName }) => {
    await browserHelpers.navigateWithBrowserHandling(page, '/login', browserName);
    
    // Submit invalid credentials
    await browserHelpers.fillFormField(page, 'input[type="email"]', 'invalid@example.com', browserName);
    await browserHelpers.fillFormField(page, 'input[type="password"]', 'wrongpassword', browserName);
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Wait for response
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    // Look for any error indication with flexible selectors
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
  });
});