import { test, expect } from './fixtures/base-test';
import { GoalType } from '@personal-hub/shared';

test.describe('Goal Pagination', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Navigate to goals tab
    await page.getByRole('button', { name: 'Goals' }).click();
    await expect(page.getByText('Goals', { exact: true })).toBeVisible();
  });

  test('should paginate goals correctly', async ({ authenticatedPage: page }) => {
    // Create 25 goals (more than default page size of 20)
    const today = new Date();
    for (let i = 1; i <= 25; i++) {
      await page.getByRole('button', { name: 'Add Goal' }).click();
      await page.getByLabel('Title').fill(`Goal ${i}`);
      await page.getByLabel('Type').selectOption(GoalType.DAILY);
      await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
      await page.getByLabel('End Date').fill(today.toISOString().slice(0, 16));
      await page.getByRole('button', { name: 'Create Goal' }).click();
      
      // Wait for form to close
      await expect(page.getByText(`Goal ${i}`)).toBeVisible();
    }

    // Verify first page shows goals 25-6 (newest first)
    for (let i = 25; i > 5; i--) {
      await expect(page.getByText(`Goal ${i}`)).toBeVisible();
    }

    // Verify goals 1-5 are not visible on first page
    for (let i = 1; i <= 5; i++) {
      await expect(page.getByText(`Goal ${i}`)).not.toBeVisible();
    }

    // Go to second page
    await page.getByRole('button', { name: 'Next' }).click();

    // Verify second page shows goals 5-1
    for (let i = 5; i >= 1; i--) {
      await expect(page.getByText(`Goal ${i}`)).toBeVisible();
    }

    // Verify goals from first page are not visible
    await expect(page.getByText('Goal 25')).not.toBeVisible();
    await expect(page.getByText('Goal 20')).not.toBeVisible();

    // Go back to first page
    await page.getByRole('button', { name: 'Previous' }).click();

    // Verify we're back on first page
    await expect(page.getByText('Goal 25')).toBeVisible();
    await expect(page.getByText('Goal 1')).not.toBeVisible();

    // Verify pagination info
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
  });

  test('should disable pagination buttons appropriately', async ({ authenticatedPage: page }) => {
    // Create just 2 goals (less than page size)
    const today = new Date();
    for (let i = 1; i <= 2; i++) {
      await page.getByRole('button', { name: 'Add Goal' }).click();
      await page.getByLabel('Title').fill(`Goal ${i}`);
      await page.getByLabel('Type').selectOption(GoalType.WEEKLY);
      await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
      await page.getByLabel('End Date').fill(today.toISOString().slice(0, 16));
      await page.getByRole('button', { name: 'Create Goal' }).click();
    }

    // Verify no pagination controls when only one page
    await expect(page.getByRole('button', { name: 'Previous' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).not.toBeVisible();
  });

  test('should maintain filters across pagination', async ({ authenticatedPage: page }) => {
    // Create multiple goals of different types
    const today = new Date();
    
    // Create 15 annual goals
    for (let i = 1; i <= 15; i++) {
      await page.getByRole('button', { name: 'Add Goal' }).click();
      await page.getByLabel('Title').fill(`Annual Goal ${i}`);
      await page.getByLabel('Type').selectOption(GoalType.ANNUAL);
      await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
      await page.getByLabel('End Date').fill(today.toISOString().slice(0, 16));
      await page.getByRole('button', { name: 'Create Goal' }).click();
    }

    // Create 15 monthly goals
    for (let i = 1; i <= 15; i++) {
      await page.getByRole('button', { name: 'Add Goal' }).click();
      await page.getByLabel('Title').fill(`Monthly Goal ${i}`);
      await page.getByLabel('Type').selectOption(GoalType.MONTHLY);
      await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
      await page.getByLabel('End Date').fill(today.toISOString().slice(0, 16));
      await page.getByRole('button', { name: 'Create Goal' }).click();
    }

    // Filter by Annual type
    await page.getByRole('combobox').nth(1).selectOption(GoalType.ANNUAL);

    // Verify only annual goals are shown
    await expect(page.getByText('Annual Goal 15')).toBeVisible();
    await expect(page.getByText('Monthly Goal', { exact: false })).not.toBeVisible();

    // Since we have 15 annual goals and page size is 20, should be single page
    await expect(page.getByRole('button', { name: 'Next' })).not.toBeVisible();
  });
});