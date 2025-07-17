import { test, expect } from './fixtures/base-test';
import { GoalTypes } from '@personal-hub/shared';
import { createGoals } from './helpers/goals';

test.describe('Goal Pagination', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Navigate to goals tab
    await page.getByRole('button', { name: 'Goals' }).click();
    await expect(page.getByText('Goals', { exact: true })).toBeVisible();
  });

  test('should paginate goals correctly', async ({ authenticatedPage: page }) => {
    // Test pagination with explicit page size assumption
    const PAGE_SIZE = 20;
    const TOTAL_GOALS = 25;
    await createGoals(page, TOTAL_GOALS);

    // Verify first page shows the most recent PAGE_SIZE goals (newest first)
    for (let i = TOTAL_GOALS; i > TOTAL_GOALS - PAGE_SIZE; i--) {
      await expect(page.getByText(`Goal ${i}`)).toBeVisible();
    }

    // Verify remaining goals are not visible on first page
    for (let i = 1; i <= TOTAL_GOALS - PAGE_SIZE; i++) {
      await expect(page.getByText(`Goal ${i}`)).not.toBeVisible();
    }

    // Go to second page
    await page.getByRole('button', { name: 'Next' }).click();

    // Verify second page shows remaining goals
    for (let i = TOTAL_GOALS - PAGE_SIZE; i >= 1; i--) {
      await expect(page.getByText(`Goal ${i}`)).toBeVisible();
    }

    // Verify goals from first page are not visible
    await expect(page.getByText(`Goal ${TOTAL_GOALS}`)).not.toBeVisible();
    await expect(page.getByText(`Goal ${TOTAL_GOALS - 5}`)).not.toBeVisible();

    // Go back to first page
    await page.getByRole('button', { name: 'Previous' }).click();

    // Verify we're back on first page
    await expect(page.getByText(`Goal ${TOTAL_GOALS}`)).toBeVisible();
    await expect(page.getByText('Goal 1')).not.toBeVisible();

    // Verify pagination info
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
  });

  test('should disable pagination buttons appropriately', async ({ authenticatedPage: page }) => {
    // Create just 2 goals (less than page size)
    await createGoals(page, 2, { type: GoalTypes.WEEKLY });

    // Verify no pagination controls when only one page
    await expect(page.getByRole('button', { name: 'Previous' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).not.toBeVisible();
  });

  test('should maintain filters across pagination', async ({ authenticatedPage: page }) => {
    // Create multiple goals of different types
    
    // Create 15 annual goals
    await createGoals(page, 15, { titlePrefix: 'Annual Goal', type: GoalTypes.ANNUAL });

    // Create 15 monthly goals
    await createGoals(page, 15, { titlePrefix: 'Monthly Goal', type: GoalTypes.MONTHLY });

    // Filter by Annual type
    await page.getByRole('combobox').nth(1).selectOption(GoalTypes.ANNUAL);

    // Verify only annual goals are shown
    await expect(page.getByText('Annual Goal 15')).toBeVisible();
    await expect(page.getByText('Monthly Goal', { exact: false })).not.toBeVisible();

    // Since we have 15 annual goals and page size is 20, should be single page
    await expect(page.getByRole('button', { name: 'Next' })).not.toBeVisible();
  });
});