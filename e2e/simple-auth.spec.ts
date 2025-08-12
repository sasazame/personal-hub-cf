import { test, expect } from '@playwright/test';

test.describe('Simple Auth Test', () => {
  test('should show landing page', async ({ page }) => {
    // Go to home page
    await page.goto('/');
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Check URL is root
    const url = page.url();
    console.log('Current URL:', url);
    expect(url).toBe('http://localhost:3000/');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/login-page.png' });
    
    // Check for landing page elements
    const heading = await page.getByRole('heading', { name: 'Your Life,', level: 1 }).isVisible();
    console.log('Email input visible:', emailInput);
    
    // Check for password input  
    const passwordInput = await page.locator('input[type="password"]').isVisible();
    console.log('Password input visible:', passwordInput);
    
    // Check for submit button
    const submitButton = await page.locator('button[type="submit"]').isVisible();
    console.log('Submit button visible:', submitButton);
  });
});