import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');
    
    // Check if redirected to login or if login form is visible
    await expect(page).toHaveURL(/\/(login|auth)/);
    
    // Check for basic login elements
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")')).toBeVisible();
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
    
    // Wait for error message in toast notification
    // React Hot Toast creates divs with role="alert" for error messages
    await expect(page.locator('div[role="alert"]')).toBeVisible({ timeout: 5000 });
  });

  test('should have registration link', async ({ page }) => {
    await page.goto('/');
    
    // Check for registration link
    await expect(page.locator('a:has-text("Register"), a:has-text("Sign up"), a:has-text("Create account")')).toBeVisible();
  });
});