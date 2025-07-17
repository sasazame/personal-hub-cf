import { test, expect } from './fixtures/base-test';
import { format } from 'date-fns';

test.describe('Events CRUD Operations', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await authenticatedPage;
    // Navigate to Events tab
    await page.getByRole('button', { name: 'Events' }).click();
    await page.waitForLoadState('networkidle');
  });

  test('should create a new event', async ({ page }) => {
    // Open create event dialog
    await page.getByRole('button', { name: 'New Event' }).click();
    
    // Fill in event details
    const eventTitle = `Test Event ${Date.now()}`;
    await page.getByLabel('Title').fill(eventTitle);
    await page.getByLabel('Description').fill('This is a test event description');
    await page.getByLabel('Location').fill('Test Location');
    
    // Set dates (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = format(tomorrow, 'yyyy-MM-dd');
    
    await page.getByLabel('Start Date & Time').fill(`${dateStr}T10:00`);
    await page.getByLabel('End Date & Time').fill(`${dateStr}T11:00`);
    
    // Set reminder
    await page.getByLabel('Reminder (minutes before)').fill('15');
    
    // Submit form
    await page.getByRole('button', { name: 'Create Event' }).click();
    
    // Verify event appears in list
    await expect(page.getByText(eventTitle)).toBeVisible();
    await expect(page.getByText('This is a test event description')).toBeVisible();
    await expect(page.getByText('Test Location')).toBeVisible();
  });

  test('should create an all-day event', async ({ page }) => {
    await page.getByRole('button', { name: 'New Event' }).click();
    
    const eventTitle = `All Day Event ${Date.now()}`;
    await page.getByLabel('Title').fill(eventTitle);
    
    // Check all-day event
    await page.getByLabel('All day event').check();
    
    // Date inputs should change to date-only
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = format(tomorrow, 'yyyy-MM-dd');
    
    await page.getByLabel('Start Date').fill(dateStr);
    await page.getByLabel('End Date').fill(dateStr);
    
    await page.getByRole('button', { name: 'Create Event' }).click();
    
    // Verify event appears with calendar icon (indicating all-day)
    await expect(page.getByText(eventTitle)).toBeVisible();
    const eventItem = page.locator('div').filter({ hasText: eventTitle }).first();
    await expect(eventItem.locator('svg')).toBeVisible(); // Calendar icon for all-day events
  });

  test('should delete an event', async ({ page }) => {
    // First create an event
    await page.getByRole('button', { name: 'New Event' }).click();
    const eventTitle = `Delete Test Event ${Date.now()}`;
    await page.getByLabel('Title').fill(eventTitle);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = format(tomorrow, 'yyyy-MM-dd');
    
    await page.getByLabel('Start Date & Time').fill(`${dateStr}T14:00`);
    await page.getByLabel('End Date & Time').fill(`${dateStr}T15:00`);
    
    await page.getByRole('button', { name: 'Create Event' }).click();
    await expect(page.getByText(eventTitle)).toBeVisible();
    
    // Delete the event
    const eventItem = page.locator('div').filter({ hasText: eventTitle }).first();
    await eventItem.getByRole('button', { name: /delete/i }).click();
    
    // Confirm deletion
    page.on('dialog', dialog => dialog.accept());
    
    // Verify event is removed
    await expect(page.getByText(eventTitle)).not.toBeVisible();
  });

  test('should handle validation errors', async ({ page }) => {
    await page.getByRole('button', { name: 'New Event' }).click();
    
    // Try to submit without required fields
    await page.getByRole('button', { name: 'Create Event' }).click();
    
    // Check for validation errors
    await expect(page.getByText(/required/i)).toBeVisible();
    
    // Fill title but set invalid date range
    await page.getByLabel('Title').fill('Invalid Date Event');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = format(tomorrow, 'yyyy-MM-dd');
    
    await page.getByLabel('Start Date & Time').fill(`${dateStr}T15:00`);
    await page.getByLabel('End Date & Time').fill(`${dateStr}T14:00`); // End before start
    
    await page.getByRole('button', { name: 'Create Event' }).click();
    
    // Should show error about date range
    await expect(page.getByText(/end.*after.*start/i)).toBeVisible();
  });

  test('should show empty state when no events', async ({ page }) => {
    // Assuming no events initially
    await expect(page.getByText('No events found')).toBeVisible();
    await expect(page.locator('svg').filter({ hasText: /calendar/i })).toBeVisible();
  });
});