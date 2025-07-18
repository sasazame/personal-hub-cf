import { test, expect } from './fixtures/base-test';

test.describe('Moments Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Moments tab
    await page.getByRole('button', { name: 'Moments' }).click();
    await page.waitForLoadState('networkidle');
  });

  test('should load more moments when clicking Load More', async ({ page }) => {
    // Create 25 moments (more than the default limit of 20)
    for (let i = 1; i <= 25; i++) {
      await page.getByPlaceholder("What's on your mind?").fill(`Moment number ${i}`);
      await page.getByRole('button', { name: 'Capture Moment' }).click();
      await page.waitForLoadState('networkidle');
    }

    // Count initial visible moments
    const initialMoments = await page.locator('text=/Moment number/').count();
    expect(initialMoments).toBe(20);

    // Verify Load More button shows remaining count
    await expect(page.getByRole('button', { name: /Load More \(5 remaining\)/ })).toBeVisible();

    // Click Load More
    await page.getByRole('button', { name: /Load More/ }).click();
    await page.waitForLoadState('networkidle');

    // Verify all moments are now visible
    const allMoments = await page.locator('text=/Moment number/').count();
    expect(allMoments).toBe(25);

    // Load More button should not be visible anymore
    await expect(page.getByRole('button', { name: /Load More/ })).not.toBeVisible();
  });

  test('should maintain search query across pagination', async ({ page }) => {
    // Create moments with specific content
    for (let i = 1; i <= 25; i++) {
      const content = i % 2 === 0 ? `Even moment ${i}` : `Odd moment ${i}`;
      await page.getByPlaceholder("What's on your mind?").fill(content);
      await page.getByRole('button', { name: 'Capture Moment' }).click();
      await page.waitForLoadState('networkidle');
    }

    // Search for "Even"
    await page.getByPlaceholder('Search moments...').fill('Even');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');

    // Should show only even moments (10 initially if limit is 20)
    const evenMoments = await page.locator('text=/Even moment/').count();
    expect(evenMoments).toBeLessThanOrEqual(12);

    // Load more if available
    const loadMoreButton = page.getByRole('button', { name: /Load More/ });
    if (await loadMoreButton.isVisible()) {
      await loadMoreButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Verify no odd moments are shown
    const oddMoments = await page.locator('text=/Odd moment/').count();
    expect(oddMoments).toBe(0);
  });

  test('should show empty state when no moments exist', async ({ page }) => {
    // Verify empty state message
    await expect(page.getByText('No moments yet. Start capturing your thoughts!')).toBeVisible();
  });
});