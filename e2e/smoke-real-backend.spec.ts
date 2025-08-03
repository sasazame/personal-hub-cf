import { test, expect } from './fixtures/base-test-real-backend';

test.describe('Smoke Tests (Real Backend)', () => {
  test('should load the application successfully', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Check basic page properties
    await expect(page).toHaveTitle(/Personal Hub/);
    
    // Since we're not authenticated, we should be redirected to login
    // Wait for the URL to change to login page
    await page.waitForURL(/\/login/, { timeout: 5000 });
    
    // Verify we're on the login page
    await expect(page).toHaveURL(/\/login/);
    
    // Check that login page loads properly - look for the login heading
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    
    // Also verify the login form elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
    
    // Check that the page doesn't show critical errors
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('500');
    await expect(page.locator('body')).not.toContainText('This page could not be found');
    
    // Basic success: page loads and has content
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
    expect(hasContent!.length).toBeGreaterThan(10);
  });

  test('should display registration page', async ({ page }) => {
    await page.goto('/register');
    
    // Check that register page loads properly
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    
    // Verify form elements
    await expect(page.locator('input[placeholder="Username"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Confirm Password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Since there's no 404 page yet, it should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });
});