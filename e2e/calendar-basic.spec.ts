import { test, expect } from '@playwright/test';
import { login, TEST_USER, ensureLoggedOut } from './helpers/auth';

test.describe('Calendar Basic E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([{ name: 'locale', value: 'en', domain: 'localhost', path: '/' }]);
    await ensureLoggedOut(page);
    await page.goto('/login');
    await login(page, TEST_USER.email, TEST_USER.password);
    await page.goto('/calendar');
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
  });

  test('should display calendar grid with current month', async ({ page }) => {
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    await expect(page.getByText(currentMonth)).toBeVisible();
    
    // Check weekday headers
    await expect(page.getByText('Sun').first()).toBeVisible();
    await expect(page.getByText('Mon').first()).toBeVisible();
    await expect(page.getByText('Sat').first()).toBeVisible();
    
    // Check calendar grid
    await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible();
  });

  test('should navigate between months', async ({ page }) => {
    const currentMonth = await page.locator('h2').filter({ hasText: /\w+ \d{4}/ }).textContent();
    
    // Previous month
    await page.locator('button').filter({ has: page.locator('.lucide-chevron-left') }).click();
    const prevMonth = await page.locator('h2').filter({ hasText: /\w+ \d{4}/ }).textContent();
    expect(prevMonth).not.toBe(currentMonth);
    
    // Today button
    await page.getByRole('button', { name: 'Today' }).click();
    const todayMonth = await page.locator('h2').filter({ hasText: /\w+ \d{4}/ }).textContent();
    expect(todayMonth).toBe(currentMonth);
  });

  test('should create a new event', async ({ page }) => {
    await page.getByRole('button', { name: 'New Event' }).click();
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible();
    
    const eventTitle = `Test Event ${Date.now()}`;
    await page.getByPlaceholder('Event title').fill(eventTitle);
    await page.getByPlaceholder('Event description').fill('Test description');
    
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Verify event appears
    await expect(page.locator('[data-testid="calendar-grid"]').locator(`text=${eventTitle}`)).toBeVisible();
  });
});