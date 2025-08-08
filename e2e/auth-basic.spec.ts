import { test, expect } from '@playwright/test';

test.describe('Basic Authentication Flow', () => {
  test('should display landing page when accessing root', async ({ page }) => {
    await page.goto('/');
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Should show landing page
    expect(page.url()).toMatch(/\/$/);
    
    // Check for landing page elements
    await expect(page.locator('h1:has-text("Your Life,")')).toBeVisible();
    await expect(page.locator('text=Transform chaos into clarity')).toBeVisible();
    
    // Check for auth links
    await expect(page.locator('nav a[href="/login"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]:has-text("Get Started")')).toBeVisible();
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