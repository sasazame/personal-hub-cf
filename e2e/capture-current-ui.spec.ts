import { test } from '@playwright/test';

test.describe('Capture Current UI', () => {
  test('capture current login page', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'e2e/screenshots/current-login-page.png',
      fullPage: true 
    });
  });

  test('capture current register page', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'e2e/screenshots/current-register-page.png',
      fullPage: true 
    });
  });
});