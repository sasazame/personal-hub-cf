import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');
    
    // Check if redirected to login or if login form is visible
    await expect(page).toHaveURL(/\/(login|auth)/);
    
    // Check for basic login elements
    await expect(page.locator('input[type="email"]').or(page.locator('input[name="email"]'))).toBeVisible();
    await expect(page.locator('input[type="password"]').or(page.locator('input[name="password"]'))).toBeVisible();
    await expect(page.locator('button[type="submit"]').or(page.locator('button:has-text("Login")')).or(page.locator('button:has-text("Sign in")'))).toBeVisible();
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/');
    
    // Fill in invalid credentials
    const emailInput = page.locator('input[type="email"]').or(page.locator('input[name="email"]'));
    const passwordInput = page.locator('input[type="password"]').or(page.locator('input[name="password"]'));
    const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Login")')).or(page.locator('button:has-text("Sign in")'));
    
    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');
    
    // Submit form
    await submitButton.click();
    
    // Wait for error message in toast notification
    // React Hot Toast creates divs with role="alert" for error messages
    await expect(page.locator('div[role="alert"]')).toBeVisible({ timeout: 5000 });
  });

  test('should have registration link', async ({ page }) => {
    await page.goto('/');
    
    // Check for registration link
    await expect(page.locator('a:has-text("Register")').or(page.locator('a:has-text("Sign up")')).or(page.locator('a:has-text("Create account")'))).toBeVisible();
  });
});