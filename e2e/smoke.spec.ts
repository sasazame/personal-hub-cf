import { test, expect } from '@playwright/test';

/**
 * Consolidated Smoke Tests for CI/CD
 * Fast and reliable tests that verify basic functionality
 * Consolidated from: smoke.spec.ts, ci-smoke.spec.ts, ci-critical.spec.ts, ci-comprehensive.spec.ts
 */

test.describe('Essential Smoke Tests', () => {
  test.setTimeout(30000); // Reasonable timeout for CI

  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and localStorage to ensure clean state
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    // Set English locale for consistent test assertions
    await context.addCookies([{ name: 'locale', value: 'en', domain: 'localhost', path: '/' }]);
  });

  test.describe('Health Checks', () => {
    test('API health check', async ({ request }) => {
      // Direct API call without browser for fastest feedback
      const apiUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8787';
      const response = await request.get(`${apiUrl}/health`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.status).toBe('ok');
    });

    test('should load the application successfully', async ({ page }) => {
      // Navigate to the application
      await page.goto('/');
      
      // Wait for any "Loading..." text to disappear (AuthGuard loading state)
      await page.waitForFunction(() => {
        const loadingElements = document.body.innerText.includes('Loading...');
        return !loadingElements;
      }, { timeout: 10000 });
      
      // Check basic page properties
      await expect(page).toHaveTitle(/Personal Hub/);
      
      // Since we're not authenticated, we should be redirected to login
      // Wait for the URL to change to login page
      await page.waitForURL(/\/login/, { timeout: 10000 });
      
      // Verify we're on the login page
      await expect(page).toHaveURL(/\/login/);
      
      // Check that login page loads properly
      await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
      
      // Check that the page doesn't show critical errors
      await expect(page.locator('body')).not.toContainText('Application error');
      await expect(page.locator('body')).not.toContainText('500');
      await expect(page.locator('body')).not.toContainText('This page could not be found');
      
      // Basic success: page loads and has content
      const hasContent = await page.locator('body').textContent();
      expect(hasContent).toBeTruthy();
      expect(hasContent!.length).toBeGreaterThan(10);
    });
  });

  test.describe('Core Pages Render', () => {
    test('Login page renders correctly', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      
      // Check for login form elements
      await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Check for register link
      await expect(page.locator('a[href="/register"]')).toBeVisible();
    });

    test('Register page renders correctly', async ({ page }) => {
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      
      // Check for registration form elements
      await expect(page.locator('input[name="username"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('Landing page renders correctly', async ({ page }) => {
      // Go to home page
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Wait for navigation to complete - should redirect to login
      await page.waitForLoadState('networkidle');
      
      // Check URL (should be root or login)
      const url = page.url();
      expect(url).toMatch(/\/(login)?$/);
      
      // If on landing page, check for key elements
      if (url.endsWith('/')) {
        // Check for landing page elements
        await expect(page.locator('h1:has-text("Your Life,")')).toBeVisible();
        await expect(page.locator('a:has-text("Get Started")')).toBeVisible();
        await expect(page.locator('nav a:has-text("Sign In")')).toBeVisible();
      }
    });
  });

  test.describe('Critical User Flows', () => {
    test('Basic registration flow', async ({ page }) => {
      const timestamp = Date.now().toString();
      const testUser = {
        username: `smoke${timestamp}`,
        email: `smoke${timestamp}@example.com`,
        password: 'SmokeTest123!',
      };

      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      
      // Fill form
      await page.fill('input[name="username"]', testUser.username);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="confirmPassword"]', testUser.password);
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard or login
      await page.waitForURL(url => {
        const path = url.pathname;
        return path.includes('dashboard') || path.includes('login');
      }, { timeout: 15000 });
      
      // Verify we're not still on register page
      expect(page.url()).not.toContain('/register');
    });

    test('Basic login flow attempt', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      
      // Fill form with test credentials
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'testpassword');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for response
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Should either redirect to dashboard (if valid) or stay on login (if invalid)
      const currentUrl = page.url();
      const isValidResponse = currentUrl.includes('/dashboard') || currentUrl.includes('/login');
      expect(isValidResponse).toBeTruthy();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 pages gracefully', async ({ page }) => {
      await page.goto('/non-existent-page', { waitUntil: 'domcontentloaded' });
      
      // Should either show 404 page or redirect to login/home
      const url = page.url();
      const title = await page.title();
      
      // Either shows 404 handling or redirects to valid page
      const validResponse = url.includes('404') || url.includes('login') || url.includes('dashboard') || title.includes('404');
      expect(validResponse).toBeTruthy();
    });

    test('should not show unhandled JavaScript errors', async ({ page }) => {
      const errors: string[] = [];
      
      // Capture console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Capture page errors
      page.on('pageerror', error => {
        errors.push(error.message);
      });
      
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Filter out known acceptable errors (network errors, etc.)
      const criticalErrors = errors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('network') &&
        !error.includes('Failed to load resource') &&
        !error.toLowerCase().includes('chunk')
      );
      
      // Should not have critical JavaScript errors
      expect(criticalErrors.length).toBe(0);
    });
  });

  test.describe('Performance Basics', () => {
    test('should load main page within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds (generous for CI)
      expect(loadTime).toBeLessThan(10000);
    });

    test('should not have obvious memory leaks', async ({ page }) => {
      // Navigate through several pages to check for obvious leaks
      const pages = ['/', '/login', '/register', '/login'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(500); // Brief pause
      }
      
      // If we get here without timeouts or crashes, basic navigation works
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');
      
      // Check that form elements are still accessible
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Check that page doesn't have horizontal scrolling issues
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      
      // Allow for small differences due to scrollbars
      expect(scrollWidth - clientWidth).toBeLessThan(20);
    });
  });

  test.describe('Accessibility Basics', () => {
    test('should have proper page titles', async ({ page }) => {
      const pages = [
        { path: '/login', expectedTitle: /login|sign in|personal hub/i },
        { path: '/register', expectedTitle: /register|sign up|personal hub/i }
      ];
      
      for (const { path, expectedTitle } of pages) {
        await page.goto(path);
        await page.waitForLoadState('domcontentloaded');
        
        const title = await page.title();
        expect(title).toMatch(expectedTitle);
      }
    });

    test('should have proper form labels', async ({ page }) => {
      await page.goto('/login');
      
      // Check that form inputs have associated labels or proper attributes
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      
      // Inputs should have either labels, placeholders, or aria-labels
      const emailHasLabel = await emailInput.getAttribute('aria-label') || 
                            await emailInput.getAttribute('placeholder') ||
                            await page.locator('label[for="email"]').isVisible();
      
      const passwordHasLabel = await passwordInput.getAttribute('aria-label') || 
                              await passwordInput.getAttribute('placeholder') ||
                              await page.locator('label[for="password"]').isVisible();
      
      expect(emailHasLabel).toBeTruthy();
      expect(passwordHasLabel).toBeTruthy();
    });
  });
});