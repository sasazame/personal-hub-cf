import { test, expect } from './fixtures/base-test';
import { GoalTypes, GoalStatuses } from '@personal-hub/shared';

test.describe('Goal CRUD Operations', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Navigate to goals tab
    await page.getByRole('button', { name: 'Goals' }).click();
    await expect(page.getByText('Goals', { exact: true })).toBeVisible();
  });

  test('should create a new goal', async ({ authenticatedPage: page }) => {
    // Click Add Goal button
    await page.getByRole('button', { name: 'Add Goal' }).click();

    // Fill in the goal form
    await page.getByLabel('Title').fill('Read 12 books');
    await page.getByLabel('Description').fill('Read one book per month');
    await page.getByLabel('Type').selectOption(GoalTypes.ANNUAL);
    await page.getByLabel('Target Value').fill('12');
    await page.getByLabel('Unit').fill('books');
    
    // Set dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    await page.getByLabel('Start Date').fill(startDate.toISOString().slice(0, 16));
    await page.getByLabel('End Date').fill(endDate.toISOString().slice(0, 16));
    
    // Submit the form
    await page.getByRole('button', { name: 'Create Goal' }).click();

    // Verify the goal appears in the list
    await expect(page.getByText('Read 12 books')).toBeVisible();
    await expect(page.getByText('Read one book per month')).toBeVisible();
    await expect(page.getByText('Annual')).toBeVisible();
    await expect(page.getByText('0 / 12 books')).toBeVisible();
  });

  test('should update goal progress', async ({ authenticatedPage: page }) => {
    // Create a goal first
    await page.getByRole('button', { name: 'Add Goal' }).click();
    await page.getByLabel('Title').fill('Daily Exercise');
    await page.getByLabel('Type').selectOption(GoalTypes.DAILY);
    await page.getByLabel('Target Value').fill('30');
    await page.getByLabel('Unit').fill('minutes');
    
    const today = new Date();
    await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
    await page.getByLabel('End Date').fill(today.toISOString().slice(0, 16));
    
    await page.getByRole('button', { name: 'Create Goal' }).click();
    await expect(page.getByText('Daily Exercise')).toBeVisible();

    // Expand the goal
    await page.getByRole('button', { name: 'Expand' }).click();

    // Add progress
    await page.getByRole('button', { name: 'Add Progress' }).click();
    await page.getByPlaceholder('Value').fill('15');
    await page.getByPlaceholder('Note (optional)').fill('Morning jog');
    await page.getByRole('button', { name: 'Add' }).click();

    // Verify progress is shown
    await expect(page.getByText('+15')).toBeVisible();
    await expect(page.getByText('Morning jog')).toBeVisible();
    await expect(page.getByText('15 / 30 minutes')).toBeVisible();
    await expect(page.getByText('50.0%')).toBeVisible();
  });

  test('should update goal status', async ({ authenticatedPage: page }) => {
    // Create a goal
    await page.getByRole('button', { name: 'Add Goal' }).click();
    await page.getByLabel('Title').fill('Learn TypeScript');
    await page.getByLabel('Type').selectOption(GoalTypes.MONTHLY);
    
    const today = new Date();
    await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
    await page.getByLabel('End Date').fill(today.toISOString().slice(0, 16));
    
    await page.getByRole('button', { name: 'Create Goal' }).click();
    await expect(page.getByText('Learn TypeScript')).toBeVisible();

    // Expand and pause the goal
    await page.getByRole('button', { name: 'Expand' }).click();
    await page.getByRole('button', { name: 'Pause' }).click();
    
    // Verify status changed
    await expect(page.getByText(GoalStatuses.PAUSED)).toBeVisible();

    // Resume the goal
    await page.getByRole('button', { name: 'Resume' }).click();
    await expect(page.getByText(GoalStatuses.ACTIVE)).toBeVisible();

    // Complete the goal
    await page.getByRole('button', { name: 'Mark Complete' }).click();
    await expect(page.getByText(GoalStatuses.COMPLETED)).toBeVisible();
  });

  test('should delete a goal', async ({ authenticatedPage: page }) => {
    // Create a goal
    await page.getByRole('button', { name: 'Add Goal' }).click();
    await page.getByLabel('Title').fill('Temporary Goal');
    await page.getByLabel('Type').selectOption(GoalTypes.WEEKLY);
    
    const today = new Date();
    await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
    await page.getByLabel('End Date').fill(today.toISOString().slice(0, 16));
    
    await page.getByRole('button', { name: 'Create Goal' }).click();
    await expect(page.getByText('Temporary Goal')).toBeVisible();

    // Delete the goal
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).click();

    // Verify goal is deleted
    await expect(page.getByText('Temporary Goal')).not.toBeVisible();
  });

  test('should filter goals by status', async ({ authenticatedPage: page }) => {
    // Create multiple goals with different statuses
    // Active goal
    await page.getByRole('button', { name: 'Add Goal' }).click();
    await page.getByLabel('Title').fill('Active Goal');
    await page.getByLabel('Type').selectOption(GoalTypes.MONTHLY);
    const today = new Date();
    await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
    await page.getByLabel('End Date').fill(today.toISOString().slice(0, 16));
    await page.getByRole('button', { name: 'Create Goal' }).click();

    // Paused goal
    await page.getByRole('button', { name: 'Add Goal' }).click();
    await page.getByLabel('Title').fill('Paused Goal');
    await page.getByLabel('Type').selectOption(GoalTypes.MONTHLY);
    await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
    await page.getByLabel('End Date').fill(today.toISOString().slice(0, 16));
    await page.getByRole('button', { name: 'Create Goal' }).click();
    
    // Pause the second goal
    await page.locator('text=Paused Goal').locator('..').getByRole('button', { name: 'Expand' }).click();
    await page.getByRole('button', { name: 'Pause' }).click();

    // Filter by Active status
    await page.getByRole('combobox').first().selectOption(GoalStatuses.ACTIVE);
    await expect(page.getByText('Active Goal')).toBeVisible();
    await expect(page.getByText('Paused Goal')).not.toBeVisible();

    // Filter by Paused status
    await page.getByRole('combobox').first().selectOption(GoalStatuses.PAUSED);
    await expect(page.getByText('Active Goal')).not.toBeVisible();
    await expect(page.getByText('Paused Goal')).toBeVisible();

    // Show all
    await page.getByRole('combobox').first().selectOption('');
    await expect(page.getByText('Active Goal')).toBeVisible();
    await expect(page.getByText('Paused Goal')).toBeVisible();
  });

  test('should filter goals by type', async ({ authenticatedPage: page }) => {
    // Create goals with different types
    const today = new Date();

    // Annual goal
    await page.getByRole('button', { name: 'Add Goal' }).click();
    await page.getByLabel('Title').fill('Annual Goal');
    await page.getByLabel('Type').selectOption(GoalTypes.ANNUAL);
    await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
    await page.getByLabel('End Date').fill(today.toISOString().slice(0, 16));
    await page.getByRole('button', { name: 'Create Goal' }).click();

    // Monthly goal
    await page.getByRole('button', { name: 'Add Goal' }).click();
    await page.getByLabel('Title').fill('Monthly Goal');
    await page.getByLabel('Type').selectOption(GoalTypes.MONTHLY);
    await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
    await page.getByLabel('End Date').fill(today.toISOString().slice(0, 16));
    await page.getByRole('button', { name: 'Create Goal' }).click();

    // Filter by Annual type
    await page.getByRole('combobox').nth(1).selectOption(GoalTypes.ANNUAL);
    await expect(page.getByText('Annual Goal')).toBeVisible();
    await expect(page.getByText('Monthly Goal')).not.toBeVisible();

    // Filter by Monthly type
    await page.getByRole('combobox').nth(1).selectOption(GoalTypes.MONTHLY);
    await expect(page.getByText('Annual Goal')).not.toBeVisible();
    await expect(page.getByText('Monthly Goal')).toBeVisible();
  });
});