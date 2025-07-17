import { test, expect } from './fixtures/base-test';
import { format, addDays, endOfWeek } from 'date-fns';
import type { Page } from '@playwright/test';

test.describe('Events Filtering and Search', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await authenticatedPage;
    await page.getByRole('button', { name: 'Events' }).click();
    await page.waitForLoadState('networkidle');
    
    // Create test events with different dates
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);
    const nextMonth = addDays(today, 35);
    
    // Today's event
    await createEvent(page, {
      title: 'Today Meeting',
      description: 'Important meeting today',
      startDate: format(today, 'yyyy-MM-dd'),
      startTime: '14:00',
      endTime: '15:00',
      location: 'Conference Room A'
    });
    
    // Tomorrow's event
    await createEvent(page, {
      title: 'Tomorrow Workshop',
      description: 'Team workshop',
      startDate: format(tomorrow, 'yyyy-MM-dd'),
      startTime: '10:00',
      endTime: '12:00',
      location: 'Training Room'
    });
    
    // Next week event
    await createEvent(page, {
      title: 'Next Week Review',
      description: 'Project review meeting',
      startDate: format(nextWeek, 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      location: 'Office'
    });
    
    // Next month event
    await createEvent(page, {
      title: 'Future Planning',
      description: 'Long-term planning session',
      startDate: format(nextMonth, 'yyyy-MM-dd'),
      startTime: '13:00',
      endTime: '16:00',
      location: 'Board Room'
    });
  });

  test('should filter events by date - Today', async ({ page }) => {
    // Select "Today" filter
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Today' }).click();
    
    // Should only show today's event
    await expect(page.getByText('Today Meeting')).toBeVisible();
    await expect(page.getByText('Tomorrow Workshop')).not.toBeVisible();
    await expect(page.getByText('Next Week Review')).not.toBeVisible();
    await expect(page.getByText('Future Planning')).not.toBeVisible();
  });

  test('should filter events by date - This Week', async ({ page }) => {
    // Select "This Week" filter
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'This Week' }).click();
    
    // Should show events within this week
    await expect(page.getByText('Today Meeting')).toBeVisible();
    await expect(page.getByText('Tomorrow Workshop')).toBeVisible();
    
    // Next week event visibility depends on current day of week
    const today = new Date();
    const nextWeek = addDays(today, 7);
    const weekEnd = endOfWeek(today);
    
    if (nextWeek <= weekEnd) {
      await expect(page.getByText('Next Week Review')).toBeVisible();
    } else {
      await expect(page.getByText('Next Week Review')).not.toBeVisible();
    }
    
    await expect(page.getByText('Future Planning')).not.toBeVisible();
  });

  test('should filter events by date - This Month', async ({ page }) => {
    // Select "This Month" filter
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'This Month' }).click();
    
    // Should show all events except next month
    await expect(page.getByText('Today Meeting')).toBeVisible();
    await expect(page.getByText('Tomorrow Workshop')).toBeVisible();
    await expect(page.getByText('Next Week Review')).toBeVisible();
    
    // Next month event visibility depends on current date
    const today = new Date();
    const nextMonth = addDays(today, 35);
    if (nextMonth.getMonth() === today.getMonth()) {
      await expect(page.getByText('Future Planning')).toBeVisible();
    } else {
      await expect(page.getByText('Future Planning')).not.toBeVisible();
    }
  });

  test('should search events by title', async ({ page }) => {
    // Search for "Workshop"
    await page.getByPlaceholder('Search events...').fill('Workshop');
    await page.waitForTimeout(500); // Debounce delay
    
    // Should only show matching event
    await expect(page.getByText('Tomorrow Workshop')).toBeVisible();
    await expect(page.getByText('Today Meeting')).not.toBeVisible();
    await expect(page.getByText('Next Week Review')).not.toBeVisible();
    await expect(page.getByText('Future Planning')).not.toBeVisible();
  });

  test('should search events by description', async ({ page }) => {
    // Search for "planning"
    await page.getByPlaceholder('Search events...').fill('planning');
    await page.waitForTimeout(500);
    
    // Should show event with "planning" in description
    await expect(page.getByText('Future Planning')).toBeVisible();
    await expect(page.getByText('Today Meeting')).not.toBeVisible();
  });

  test('should search events by location', async ({ page }) => {
    // Search for "Room"
    await page.getByPlaceholder('Search events...').fill('Room');
    await page.waitForTimeout(500);
    
    // Should show events with "Room" in location
    await expect(page.getByText('Today Meeting')).toBeVisible(); // Conference Room A
    await expect(page.getByText('Tomorrow Workshop')).toBeVisible(); // Training Room
    await expect(page.getByText('Future Planning')).toBeVisible(); // Board Room
    await expect(page.getByText('Next Week Review')).not.toBeVisible(); // Office
  });

  test('should combine search and date filter', async ({ page }) => {
    // First apply date filter
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'This Week' }).click();
    
    // Then search
    await page.getByPlaceholder('Search events...').fill('Meeting');
    await page.waitForTimeout(500);
    
    // Should only show today's meeting (in this week AND has "Meeting")
    await expect(page.getByText('Today Meeting')).toBeVisible();
    await expect(page.getByText('Tomorrow Workshop')).not.toBeVisible();
    await expect(page.getByText('Next Week Review')).not.toBeVisible();
  });

  test('should show empty state with search', async ({ page }) => {
    // Search for non-existent event
    await page.getByPlaceholder('Search events...').fill('NonExistentEvent');
    await page.waitForTimeout(500);
    
    await expect(page.getByText('No events found')).toBeVisible();
    await expect(page.getByText('Try adjusting your search')).toBeVisible();
  });

  test('should clear filters and show all events', async ({ page }) => {
    // Apply filter
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Today' }).click();
    
    // Apply search
    await page.getByPlaceholder('Search events...').fill('Meeting');
    await page.waitForTimeout(500);
    
    // Clear search
    await page.getByPlaceholder('Search events...').clear();
    await page.waitForTimeout(500);
    
    // Clear date filter by selecting "All Events"
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'All Events' }).click();
    
    // Should show all events again
    await expect(page.getByText('Today Meeting')).toBeVisible();
    await expect(page.getByText('Tomorrow Workshop')).toBeVisible();
    await expect(page.getByText('Next Week Review')).toBeVisible();
    await expect(page.getByText('Future Planning')).toBeVisible();
  });
});

// Helper function to create an event
async function createEvent(page: Page, event: {
  title: string;
  description?: string;
  startDate: string;
  startTime: string;
  endTime: string;
  location?: string;
}) {
  await page.getByRole('button', { name: 'New Event' }).click();
  
  await page.getByLabel('Title').fill(event.title);
  if (event.description) {
    await page.getByLabel('Description').fill(event.description);
  }
  
  await page.getByLabel('Start Date & Time').fill(`${event.startDate}T${event.startTime}`);
  await page.getByLabel('End Date & Time').fill(`${event.startDate}T${event.endTime}`);
  
  if (event.location) {
    await page.getByLabel('Location').fill(event.location);
  }
  
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.waitForTimeout(500); // Wait for event to be created
}