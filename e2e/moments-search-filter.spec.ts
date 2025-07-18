import { test, expect } from './fixtures/base-test';

test.describe('Moments Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Moments tab
    await page.getByRole('button', { name: 'Moments' }).click();
    await page.waitForLoadState('networkidle');

    // Create test moments
    const moments = [
      { content: 'Morning coffee thoughts', tags: ['morning', 'coffee'] },
      { content: 'Great lunch meeting today', tags: ['work', 'meeting'] },
      { content: 'Evening workout completed', tags: ['fitness', 'evening'] },
      { content: 'Reading a great book', tags: ['reading', 'evening'] },
    ];

    for (const moment of moments) {
      await page.getByPlaceholder("What's on your mind?").fill(moment.content);
      
      for (const tag of moment.tags) {
        await page.getByPlaceholder('Add tags (press Enter)').fill(tag);
        await page.keyboard.press('Enter');
      }
      
      await page.getByRole('button', { name: 'Capture Moment' }).click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should search moments by content', async ({ page }) => {
    // Search for "coffee"
    await page.getByPlaceholder('Search moments...').fill('coffee');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');

    // Verify results
    await expect(page.getByText('Morning coffee thoughts')).toBeVisible();
    await expect(page.getByText('Great lunch meeting today')).not.toBeVisible();
    await expect(page.getByText('Evening workout completed')).not.toBeVisible();
    await expect(page.getByText('Reading a great book')).not.toBeVisible();
  });

  test('should filter moments by tag', async ({ page }) => {
    // Click on the "evening" tag
    await page.getByRole('button', { name: 'evening' }).first().click();
    await page.waitForLoadState('networkidle');

    // Verify filtered results
    await expect(page.getByText('Evening workout completed')).toBeVisible();
    await expect(page.getByText('Reading a great book')).toBeVisible();
    await expect(page.getByText('Morning coffee thoughts')).not.toBeVisible();
    await expect(page.getByText('Great lunch meeting today')).not.toBeVisible();
  });

  test('should clear tag filter', async ({ page }) => {
    // Apply a tag filter
    await page.getByRole('button', { name: 'morning' }).first().click();
    await page.waitForLoadState('networkidle');

    // Verify filtered state
    await expect(page.getByText('Morning coffee thoughts')).toBeVisible();
    await expect(page.getByText('Great lunch meeting today')).not.toBeVisible();

    // Clear the filter
    await page.getByRole('button', { name: 'Clear' }).click();
    await page.waitForLoadState('networkidle');

    // Verify all moments are visible again
    await expect(page.getByText('Morning coffee thoughts')).toBeVisible();
    await expect(page.getByText('Great lunch meeting today')).toBeVisible();
    await expect(page.getByText('Evening workout completed')).toBeVisible();
    await expect(page.getByText('Reading a great book')).toBeVisible();
  });

  test('should show no results message for empty search', async ({ page }) => {
    // Search for something that doesn't exist
    await page.getByPlaceholder('Search moments...').fill('xyz123notfound');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');

    // Verify no results message
    await expect(page.getByText('No moments found matching your search.')).toBeVisible();
  });

  test('should display all unique tags', async ({ page }) => {
    // Verify all unique tags are displayed
    const tags = ['morning', 'coffee', 'work', 'meeting', 'fitness', 'evening', 'reading'];
    
    for (const tag of tags) {
      await expect(page.getByRole('button', { name: tag }).first()).toBeVisible();
    }
  });
});