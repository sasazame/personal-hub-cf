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
    
    // Check for landing page elements (tolerate variations and redirect)
    const heading = page.getByRole('heading', { name: /Your Life,/i, level: 1 });
    const emailField = page.getByRole('textbox', { name: /email/i });
    
    // Check visibility with proper error handling
    const headingVisible = await heading.isVisible().catch(() => false);
    const emailVisible = await emailField.isVisible().catch(() => false);
    
    console.log('Landing heading visible:', headingVisible);
    console.log('Email input visible:', emailVisible);
    
    // Assert that we're on either the landing page or login page
    expect(headingVisible || emailVisible).toBe(true);
    
    // Check for password input  
    const passwordInput = await page.locator('input[type="password"]').isVisible();
    console.log('Password input visible:', passwordInput);
    
    // Check for submit button
    const submitButton = await page.locator('button[type="submit"]').isVisible();
    console.log('Submit button visible:', submitButton);
  });
});