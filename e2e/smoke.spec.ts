import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('frontend should be accessible', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('backend health check should pass', async ({ request }) => {
    const response = await request.get('http://localhost:8787/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
  });

  test('should have proper page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Personal Hub/i);
  });
});