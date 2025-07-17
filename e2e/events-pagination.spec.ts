import { test, expect } from './fixtures/base-test';
import { format, addDays } from 'date-fns';

test.describe('Events Pagination', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await authenticatedPage;
    await page.getByRole('button', { name: 'Events' }).click();
    await page.waitForLoadState('networkidle');
    
    // Create 25 events to test pagination (page size is 20)
    const baseDate = new Date();
    for (let i = 0; i < 25; i++) {
      const eventDate = addDays(baseDate, i);
      await createEvent(page, {
        title: `Event ${i + 1}`,
        startDate: format(eventDate, 'yyyy-MM-dd'),
        startTime: '10:00',
        endTime: '11:00'
      });
    }
  });

  test('should show pagination controls when more than 20 events', async ({ page }) => {
    // Pagination controls should be visible
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  test('should navigate to next page', async ({ page }) => {
    // Verify first page shows events 1-20
    await expect(page.getByText('Event 1')).toBeVisible();
    await expect(page.getByText('Event 20')).toBeVisible();
    await expect(page.getByText('Event 21')).not.toBeVisible();
    
    // Navigate to next page
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForLoadState('networkidle');
    
    // Verify second page shows remaining events
    await expect(page.getByText('Event 1')).not.toBeVisible();
    await expect(page.getByText('Event 21')).toBeVisible();
    await expect(page.getByText('Event 25')).toBeVisible();
    
    // Pagination state should update
    await expect(page.getByText('Page 2 of 2')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  test('should navigate back to previous page', async ({ page }) => {
    // Go to page 2
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForLoadState('networkidle');
    
    // Navigate back to page 1
    await page.getByRole('button', { name: 'Previous' }).click();
    await page.waitForLoadState('networkidle');
    
    // Verify we're back on page 1
    await expect(page.getByText('Event 1')).toBeVisible();
    await expect(page.getByText('Event 20')).toBeVisible();
    await expect(page.getByText('Event 21')).not.toBeVisible();
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
  });

  test('should maintain pagination with filters', async ({ page }) => {
    // Search to reduce results
    await page.getByPlaceholder('Search events...').fill('Event 2');
    await page.waitForTimeout(500);
    
    // Should show: Event 2, Event 20, Event 21, Event 22, Event 23, Event 24, Event 25
    // Total: 7 events (no pagination needed)
    await expect(page.getByText('Event 2')).toBeVisible();
    await expect(page.getByText('Event 20')).toBeVisible();
    
    // Pagination should not be visible with less than 20 results
    await expect(page.getByText(/Page \d+ of \d+/)).not.toBeVisible();
    
    // Clear search to restore pagination
    await page.getByPlaceholder('Search events...').clear();
    await page.waitForTimeout(500);
    
    // Pagination should reappear
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
  });

  test('should reset to page 1 when applying filters', async ({ page }) => {
    // Go to page 2
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Page 2 of 2')).toBeVisible();
    
    // Apply a search filter
    await page.getByPlaceholder('Search events...').fill('Event 1');
    await page.waitForTimeout(500);
    
    // Should reset to page 1 (if pagination is still needed)
    // Or no pagination if results fit on one page
    const paginationText = page.getByText(/Page \d+ of \d+/);
    const isPaginationVisible = await paginationText.isVisible().catch(() => false);
    
    if (isPaginationVisible) {
      await expect(page.getByText('Page 1 of')).toBeVisible();
    }
  });

  test('should show correct event count in empty state', async ({ page }) => {
    // Search for non-existent event
    await page.getByPlaceholder('Search events...').fill('NonExistent');
    await page.waitForTimeout(500);
    
    // Should show empty state without pagination
    await expect(page.getByText('No events found')).toBeVisible();
    await expect(page.getByText(/Page \d+ of \d+/)).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).not.toBeVisible();
  });
});

// Helper function to create events quickly
async function createEvent(page: any, event: {
  title: string;
  startDate: string;
  startTime: string;
  endTime: string;
}) {
  await page.getByRole('button', { name: 'New Event' }).click();
  await page.getByLabel('Title').fill(event.title);
  await page.getByLabel('Start Date & Time').fill(`${event.startDate}T${event.startTime}`);
  await page.getByLabel('End Date & Time').fill(`${event.startDate}T${event.endTime}`);
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.waitForTimeout(300);
}