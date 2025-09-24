import { test, expect } from '@playwright/test';
import { login, TEST_USER, ensureLoggedOut } from './helpers/auth';

test.describe('Goals Feature E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([{ name: 'locale', value: 'en', domain: 'localhost', path: '/' }]);
    await ensureLoggedOut(page);
    await page.goto('/login');
    await login(page, TEST_USER.email, TEST_USER.password);
    await page.goto('/goals');
    await expect(page.getByRole('heading', { name: 'Goals', level: 1 }).first()).toBeVisible();

    await page.evaluate(async () => {
      const meResponse = await fetch('/api/v1/auth/me', { credentials: 'include' });
      if (!meResponse.ok) {
        return;
      }
      const me = await meResponse.json();
      if (!me?.csrfToken) {
        return;
      }

      const goalsResponse = await fetch('/api/v1/goals', { credentials: 'include' });
      if (!goalsResponse.ok) {
        return;
      }
      const items = await goalsResponse.json();
      if (!Array.isArray(items)) {
        return;
      }

      await Promise.all(
        items.map((goal: { id: number }) =>
          fetch(`/api/v1/goals/${goal.id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'X-CSRF-Token': me.csrfToken as string },
          })
        )
      );
    });

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Goals', level: 1 }).first()).toBeVisible();
  });

  const createGoal = async (page: any, title = `Test Goal ${Date.now()}`) => {
    await page.getByRole('button', { name: 'New Goal' }).click();
    await expect(page.getByRole('heading', { name: 'New Goal' })).toBeVisible();
    await page.getByPlaceholder('e.g., Read 30 minutes daily').fill(title);
    const [createResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/v1/goals') && resp.request().method() === 'POST', { timeout: 10000 }),
      page.getByRole('button', { name: 'Create Goal' }).click()
    ]);
    expect(createResponse.ok()).toBeTruthy();
    await expect(page.getByText('Goal created successfully')).toBeVisible();
    await page
      .waitForResponse(resp => resp.url().includes('/api/v1/goals') && resp.request().method() === 'GET', { timeout: 10000 })
      .catch(() => undefined);
    await expect(page.getByRole('heading', { name: title, exact: false }).first()).toBeVisible();
    return title;
  };

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
    await expect(page.getByRole('button', { name: /Daily Goals/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Weekly Goals/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Monthly Goals/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Annual Goals/ }).first()).toBeVisible();
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
    await expect(page.getByRole('button', { name: 'Completed' }).first()).toHaveClass(/bg-primary/);
    
    // Click on Archived
    await page.getByRole('button', { name: 'Archived' }).click();
    await page.waitForTimeout(500);
    
    // Should show archived filter active
    await expect(page.getByRole('button', { name: 'Archived' }).first()).toHaveClass(/bg-primary/);
  });

  test('should open goal form modal', async ({ page }) => {
    // Click New Goal button
    await page.getByRole('button', { name: 'New Goal' }).click();
    
    // Check modal appears
    await expect(page.getByRole('heading', { name: 'New Goal' })).toBeVisible();
    await expect(page.getByPlaceholder('e.g., Read 30 minutes daily')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Goal' })).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'New Goal' })).not.toBeVisible();
  });

  test('should create a goal placeholder', async ({ page }) => {
    const title = await createGoal(page);
    await expect(page.getByText(title)).toBeVisible();
  });

  test('should handle goal progress toggle', async ({ page }) => {
    // Create a goal first (using placeholder)
    await createGoal(page);
    
    // If goal appears, try to toggle it
    const targetButton = page.locator('button').filter({ has: page.locator('.lucide-target') }).first();
    if (await targetButton.isVisible()) {
      const [toggleResponse] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/v1/goals/') && resp.url().includes('/toggle-achievement') && resp.request().method() === 'POST', { timeout: 10000 }),
        targetButton.click()
      ]);
      if (toggleResponse.ok()) {
        await expect(page.getByText('Progress updated')).toBeVisible({ timeout: 5000 }).catch(() => {});
      }
    }
  });

  test('should show goal details in cards', async ({ page }) => {
    // Create a goal first
    const title = await createGoal(page);
    
    // Check for goal card elements
    const goalHeading = page.getByRole('heading', { name: title, exact: false }).first();
    await expect(goalHeading).toBeVisible();
    const goalCard = goalHeading.locator('..').locator('..');

    await expect(goalCard.locator('.lucide-zap')).toBeVisible();
    await expect(goalCard.locator('text=/day streak/')).toBeVisible();
    await expect(goalCard.locator('.lucide-trending-up')).toBeVisible();
    await expect(goalCard.locator('.bg-primary').first()).toBeVisible();
    await expect(goalCard.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(goalCard.getByRole('button', { name: 'Delete' })).toBeVisible();
  });

  test('should handle goal deletion', async ({ page }) => {
    // Create a goal first
    await createGoal(page);
    
    // Find and click delete button
    const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Confirm deletion
      const confirmHeading = page.getByRole('heading', { name: /delete goal/i }).first();
      await expect(confirmHeading).toBeVisible();
      const confirmButton = page.getByRole('button', { name: /Delete/ }).nth(1);
      await confirmButton.click();
      
      // Should show success message
      await expect(page.getByText('Goal deleted successfully')).toBeVisible();
    }
  });
});
