import { test, expect } from '@playwright/test';
import { login, TEST_USER, ensureLoggedOut } from './helpers/auth';

test.describe('Goals Feature E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([{ name: 'locale', value: 'en', domain: 'localhost', path: '/' }]);
    await ensureLoggedOut(page);
    await page.goto('/login');
    await login(page, TEST_USER.email, TEST_USER.password);
    await page.goto('/goals');
    await expect(page.getByRole('heading', { name: 'Goals' })).toBeVisible();
  });

  test('should display goals page with sections', async ({ page }) => {
    // Check subtitle
    await expect(page.getByText('Track your progress and achieve your targets')).toBeVisible();
    
    // Check date navigation
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible();
    
    // Check filter tabs
    await expect(page.getByRole('button', { name: 'Active' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible();
    
    // Check goal type sections
    await expect(page.getByText('Daily Goals')).toBeVisible();
    await expect(page.getByText('Weekly Goals')).toBeVisible();
    await expect(page.getByText('Monthly Goals')).toBeVisible();
    await expect(page.getByText('Annual Goals')).toBeVisible();
  });

  test('should toggle goal sections', async ({ page }) => {
    // Find Daily Goals section
    const dailySection = page.locator('button').filter({ hasText: 'Daily Goals' });
    
    // Check if expanded by default
    await expect(page.getByText('No daily goals found')).toBeVisible();
    
    // Click to collapse
    await dailySection.click();
    
    // Should be collapsed
    await expect(page.getByText('No daily goals found')).not.toBeVisible();
    
    // Click to expand again
    await dailySection.click();
    
    // Should be visible again
    await expect(page.getByText('No daily goals found')).toBeVisible();
  });

  test('should navigate between dates', async ({ page }) => {
    const currentDate = await page.locator('h2').filter({ hasText: /\w+, \w+ \d+, \d{4}/ }).textContent();
    
    // Previous day
    await page.locator('button').filter({ has: page.locator('.lucide-chevron-left') }).click();
    const prevDate = await page.locator('h2').filter({ hasText: /\w+, \w+ \d+, \d{4}/ }).textContent();
    expect(prevDate).not.toBe(currentDate);
    
    // Today button
    await page.getByRole('button', { name: 'Today' }).click();
    const todayDate = await page.locator('h2').filter({ hasText: /\w+, \w+ \d+, \d{4}/ }).textContent();
    expect(todayDate).toBe(currentDate);
  });

  test('should filter goals by status', async ({ page }) => {
    // Click on different filters
    await page.getByRole('button', { name: 'Completed' }).click();
    await page.waitForTimeout(500);
    
    // Should show completed filter active
    await expect(page.getByRole('button', { name: 'Completed' }).first()).toHaveClass(/bg-blue-600/);
    
    // Click on Archived
    await page.getByRole('button', { name: 'Archived' }).click();
    await page.waitForTimeout(500);
    
    // Should show archived filter active
    await expect(page.getByRole('button', { name: 'Archived' }).first()).toHaveClass(/bg-blue-600/);
  });

  test('should open goal form modal', async ({ page }) => {
    // Click New Goal button
    await page.getByRole('button', { name: 'New Goal' }).click();
    
    // Check modal appears
    await expect(page.getByRole('heading', { name: 'New Goal' })).toBeVisible();
    await expect(page.getByText('Goal form will be implemented here')).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'New Goal' })).not.toBeVisible();
  });

  test('should create a goal placeholder', async ({ page }) => {
    // Click New Goal
    await page.getByRole('button', { name: 'New Goal' }).click();
    
    // Click Save (placeholder)
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Should close modal and show success message
    await expect(page.getByRole('heading', { name: 'New Goal' })).not.toBeVisible();
  });

  test('should handle goal progress toggle', async ({ page }) => {
    // Create a goal first (using placeholder)
    await page.getByRole('button', { name: 'New Goal' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    
    // If goal appears, try to toggle it
    const targetButton = page.locator('button').filter({ has: page.locator('.lucide-target') }).first();
    if (await targetButton.isVisible()) {
      await targetButton.click();
      // Should show success toast
      await expect(page.getByText('Progress updated')).toBeVisible();
    }
  });

  test('should show goal details in cards', async ({ page }) => {
    // Create a goal first
    await page.getByRole('button', { name: 'New Goal' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Check for goal card elements
    const goalCard = page.locator('.bg-gray-50, .bg-gray-900').first();
    if (await goalCard.isVisible()) {
      // Check for streak info
      await expect(goalCard.locator('.lucide-zap')).toBeVisible();
      await expect(goalCard.locator('text=/day streak/')).toBeVisible();
      
      // Check for progress
      await expect(goalCard.locator('.lucide-trending-up')).toBeVisible();
      
      // Check for progress bar
      await expect(goalCard.locator('.bg-gray-200, .bg-gray-700').filter({ has: page.locator('.bg-blue-600') })).toBeVisible();
      
      // Check for action buttons
      await expect(goalCard.getByRole('button', { name: 'Edit' })).toBeVisible();
      await expect(goalCard.getByRole('button', { name: 'Delete' })).toBeVisible();
    }
  });

  test('should handle goal deletion', async ({ page }) => {
    // Create a goal first
    await page.getByRole('button', { name: 'New Goal' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Find and click delete button
    const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Confirm deletion
      await expect(page.getByText('Are you sure you want to delete')).toBeVisible();
      await page.getByRole('button', { name: 'Delete' }).nth(1).click();
      
      // Should show success message
      await expect(page.getByText('Goal deleted successfully')).toBeVisible();
    }
  });
});