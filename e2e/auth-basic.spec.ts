import { test, expect } from '@playwright/test';

test.describe('Basic Authentication Flow', () => {
  test('should display login page when accessing root', async ({ page }) => {
    await page.goto('/');
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to login
    expect(page.url()).toContain('/login');
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for register link
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('should handle invalid login attempt', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Fill invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for network response
    await page.waitForLoadState('networkidle');
    
    // Should still be on login page
    expect(page.url()).toContain('/login');
    
    // Check that form is still visible (indicating login failed)
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});