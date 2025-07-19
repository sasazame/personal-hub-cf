import { test, expect } from './fixtures/base-test';
import { GoalTypes } from './utils/enums';

test.describe('Goal Progress Tracking', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Navigate to goals tab
    await page.getByRole('button', { name: 'Goals' }).click();
    await expect(page.getByText('Goals', { exact: true })).toBeVisible();
  });

  test('should track cumulative progress', async ({ authenticatedPage: page }) => {
    // Create a goal with target value
    await page.getByRole('button', { name: 'Add Goal' }).click();
    await page.getByLabel('Title').fill('Read 100 pages');
    await page.getByLabel('Type').selectOption(GoalTypes.WEEKLY);
    await page.getByLabel('Target Value').fill('100');
    await page.getByLabel('Unit').fill('pages');
    
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
    await page.getByLabel('End Date').fill(nextWeek.toISOString().slice(0, 16));
    await page.getByRole('button', { name: 'Create Goal' }).click();

    // Verify initial state
    await expect(page.getByText('0 / 100 pages')).toBeVisible();
    await expect(page.getByText('0.0%')).toBeVisible();

    // Expand goal and add multiple progress entries
    await page.getByRole('button', { name: 'Expand' }).click();

    // Add first progress
    await page.getByRole('button', { name: 'Add Progress' }).click();
    await page.getByPlaceholder('Value').fill('25');
    await page.getByPlaceholder('Note (optional)').fill('Chapter 1-2');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('25 / 100 pages')).toBeVisible();
    await expect(page.getByText('25.0%')).toBeVisible();

    // Add second progress
    await page.getByRole('button', { name: 'Add Progress' }).click();
    await page.getByPlaceholder('Value').fill('30');
    await page.getByPlaceholder('Note (optional)').fill('Chapter 3-4');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('55 / 100 pages')).toBeVisible();
    await expect(page.getByText('55.0%')).toBeVisible();

    // Add third progress to reach 100%
    await page.getByRole('button', { name: 'Add Progress' }).click();
    await page.getByPlaceholder('Value').fill('45');
    await page.getByPlaceholder('Note (optional)').fill('Finished!');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('100 / 100 pages')).toBeVisible();
    await expect(page.getByText('100.0%')).toBeVisible();

    // Verify progress history shows all entries
    await expect(page.getByText('+25')).toBeVisible();
    await expect(page.getByText('Chapter 1-2')).toBeVisible();
    await expect(page.getByText('+30')).toBeVisible();
    await expect(page.getByText('Chapter 3-4')).toBeVisible();
    await expect(page.getByText('+45')).toBeVisible();
    await expect(page.getByText('Finished!')).toBeVisible();
  });

  test('should handle goals without target values', async ({ authenticatedPage: page }) => {
    // Create a goal without target value
    await page.getByRole('button', { name: 'Add Goal' }).click();
    await page.getByLabel('Title').fill('Daily Meditation');
    await page.getByLabel('Type').selectOption(GoalTypes.DAILY);
    await page.getByLabel('Unit').fill('sessions');
    
    const today = new Date();
    await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
    await page.getByLabel('End Date').fill(today.toISOString().slice(0, 16));
    await page.getByRole('button', { name: 'Create Goal' }).click();

    // Verify no progress bar is shown
    await expect(page.getByText('0%')).not.toBeVisible();
    await expect(page.getByText('/ sessions')).not.toBeVisible();

    // Can still add progress
    await page.getByRole('button', { name: 'Expand' }).click();
    await page.getByRole('button', { name: 'Add Progress' }).click();
    await page.getByPlaceholder('Value').fill('1');
    await page.getByPlaceholder('Note (optional)').fill('Morning session');
    await page.getByRole('button', { name: 'Add' }).click();

    // Verify progress is tracked
    await expect(page.getByText('+1')).toBeVisible();
    await expect(page.getByText('Morning session')).toBeVisible();
  });

  test('should display progress with custom colors', async ({ authenticatedPage: page }) => {
    // Create a goal with custom color
    await page.getByRole('button', { name: 'Add Goal' }).click();
    await page.getByLabel('Title').fill('Water Intake');
    await page.getByLabel('Type').selectOption(GoalTypes.DAILY);
    await page.getByLabel('Target Value').fill('8');
    await page.getByLabel('Unit').fill('glasses');
    await page.getByLabel('Color').fill('#00AAFF');
    
    const today = new Date();
    await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
    await page.getByLabel('End Date').fill(today.toISOString().slice(0, 16));
    await page.getByRole('button', { name: 'Create Goal' }).click();

    // Add some progress
    await page.getByRole('button', { name: 'Expand' }).click();
    await page.getByRole('button', { name: 'Add Progress' }).click();
    await page.getByPlaceholder('Value').fill('4');
    await page.getByRole('button', { name: 'Add' }).click();

    // Verify progress bar has custom color
    const progressBar = page.locator('.bg-blue-600').first();
    await expect(progressBar).toHaveCSS('background-color', 'rgb(0, 170, 255)');
  });

  test('should not allow progress on completed goals', async ({ authenticatedPage: page }) => {
    // Create and complete a goal
    await page.getByRole('button', { name: 'Add Goal' }).click();
    await page.getByLabel('Title').fill('Finish Project');
    await page.getByLabel('Type').selectOption(GoalTypes.MONTHLY);
    
    const today = new Date();
    await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
    await page.getByLabel('End Date').fill(today.toISOString().slice(0, 16));
    await page.getByRole('button', { name: 'Create Goal' }).click();

    // Expand and complete the goal
    await page.getByRole('button', { name: 'Expand' }).click();
    await page.getByRole('button', { name: 'Mark Complete' }).click();

    // Verify Add Progress button is not shown
    await expect(page.getByRole('button', { name: 'Add Progress' })).not.toBeVisible();
  });

  test('should show progress entries in reverse chronological order', async ({ authenticatedPage: page }) => {
    // Create a goal
    await page.getByRole('button', { name: 'Add Goal' }).click();
    await page.getByLabel('Title').fill('Study Hours');
    await page.getByLabel('Type').selectOption(GoalTypes.WEEKLY);
    await page.getByLabel('Target Value').fill('20');
    await page.getByLabel('Unit').fill('hours');
    
    const today = new Date();
    await page.getByLabel('Start Date').fill(today.toISOString().slice(0, 16));
    await page.getByLabel('End Date').fill(today.toISOString().slice(0, 16));
    await page.getByRole('button', { name: 'Create Goal' }).click();

    // Expand and add multiple progress entries with different notes
    await page.getByRole('button', { name: 'Expand' }).click();

    // Add entries
    const entries = [
      { value: '2', note: 'Morning study' },
      { value: '3', note: 'Afternoon study' },
      { value: '1.5', note: 'Evening review' }
    ];

    for (const entry of entries) {
      await page.getByRole('button', { name: 'Add Progress' }).click();
      await page.getByPlaceholder('Value').fill(entry.value);
      await page.getByPlaceholder('Note (optional)').fill(entry.note);
      await page.getByRole('button', { name: 'Add' }).click();
      await page.waitForTimeout(100); // Small delay to ensure different timestamps
    }

    // Verify entries appear in reverse order (newest first)
    const progressEntries = page.locator('.space-y-1 > div');
    await expect(progressEntries.nth(0)).toContainText('Evening review');
    await expect(progressEntries.nth(1)).toContainText('Afternoon study');
    await expect(progressEntries.nth(2)).toContainText('Morning study');
  });
});