import { test, expect } from '@playwright/test';

test.describe('Simple Auth Test', () => {
  test('should redirect to login page', async ({ page }) => {
    // Go to home page
    await page.goto('/');
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Check URL contains login
    const url = page.url();
    console.log('Current URL:', url);
    expect(url).toContain('/login');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/login-page.png' });
    
    // Check for email input
    const emailInput = await page.locator('input[type="email"]').isVisible();
    console.log('Email input visible:', emailInput);
    
    // Check for password input  
    const passwordInput = await page.locator('input[type="password"]').isVisible();
    console.log('Password input visible:', passwordInput);
    
    // Check for submit button
    const submitButton = await page.locator('button[type="submit"]').isVisible();
    console.log('Submit button visible:', submitButton);
  });
});