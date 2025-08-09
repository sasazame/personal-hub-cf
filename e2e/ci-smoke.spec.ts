import { test, expect } from '@playwright/test';

/**
 * Minimal smoke tests for CI - fast and reliable
 * These tests verify basic functionality without complex flows
 */

test.describe('CI Smoke Tests', () => {
  test.setTimeout(20000); // Shorter timeout for faster feedback

  test('API health check', async ({ request }) => {
    // Direct API call without browser
    const apiUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8787';
    const response = await request.get(`${apiUrl}/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('Frontend loads successfully', async ({ page }) => {
    // Simple page load test
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Should redirect to landing or login
    await expect(page).toHaveURL(/\/(landing|login)?$/);
    
    // Basic check for page content
    const title = await page.title();
    expect(title).toContain('Personal Hub');
  });

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

  test('Basic registration flow', async ({ page }) => {
    const timestamp = Date.now().toString();
    const testUser = {
      username: `test${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'TestPass123!',
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
    }, { timeout: 10000 });
    
    // Verify we're not still on register page
    expect(page.url()).not.toContain('/register');
  });
});