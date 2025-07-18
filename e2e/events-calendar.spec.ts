import { test, expect } from './fixtures/base-test';
import { format } from 'date-fns';

test.describe('Events Calendar View', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.click('button:has-text("Events")');
  });

  test('should navigate to calendar view', async ({ authenticatedPage }) => {
    await authenticatedPage.click('button:has-text("Calendar View")');
    
    // Check that calendar is displayed
    await expect(authenticatedPage.locator('.rbc-calendar')).toBeVisible();
    
    // Check view buttons
    await expect(authenticatedPage.locator('button:has-text("Month")')).toBeVisible();
    await expect(authenticatedPage.locator('button:has-text("Week")')).toBeVisible();
    await expect(authenticatedPage.locator('button:has-text("Day")')).toBeVisible();
    
    // Check navigation buttons
    await expect(authenticatedPage.locator('button:has-text("Today")')).toBeVisible();
    await expect(authenticatedPage.locator('button:has-text("Back")')).toBeVisible();
    await expect(authenticatedPage.locator('button:has-text("Next")')).toBeVisible();
  });

  test('should switch between calendar views', async ({ authenticatedPage }) => {
    await authenticatedPage.click('button:has-text("Calendar View")');
    
    // Test week view
    await authenticatedPage.click('button:has-text("Week")');
    await expect(authenticatedPage.locator('.rbc-time-view')).toBeVisible();
    
    // Test day view
    await authenticatedPage.click('button:has-text("Day")');
    await expect(authenticatedPage.locator('.rbc-time-view')).toBeVisible();
    
    // Test month view
    await authenticatedPage.click('button:has-text("Month")');
    await expect(authenticatedPage.locator('.rbc-month-view')).toBeVisible();
  });

  test('should create event by clicking on calendar', async ({ authenticatedPage }) => {
    await authenticatedPage.click('button:has-text("Calendar View")');
    
    // Click on a calendar date
    const today = new Date();
    const todayCell = authenticatedPage.locator(`.rbc-date-cell:has-text("${today.getDate()}")`).first();
    await todayCell.click();
    
    // Check that event form opens
    await expect(authenticatedPage.locator('text="Create New Event"')).toBeVisible();
    
    // Fill in event details
    await authenticatedPage.fill('input[name="title"]', 'Test Calendar Event');
    await authenticatedPage.fill('textarea[name="description"]', 'Created from calendar');
    
    // Submit form
    await authenticatedPage.click('button:has-text("Create Event")');
    
    // Wait for dialog to close
    await expect(authenticatedPage.locator('text="Create New Event"')).not.toBeVisible();
    
    // Check that event appears on calendar
    await expect(authenticatedPage.locator('.rbc-event:has-text("Test Calendar Event")')).toBeVisible();
  });

  test('should navigate between months', async ({ authenticatedPage }) => {
    await authenticatedPage.click('button:has-text("Calendar View")');
    
    const currentMonth = format(new Date(), 'MMMM yyyy');
    await expect(authenticatedPage.locator(`text="${currentMonth}"`)).toBeVisible();
    
    // Navigate to next month
    await authenticatedPage.click('button:has-text("Next")');
    const nextMonth = format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'MMMM yyyy');
    await expect(authenticatedPage.locator(`text="${nextMonth}"`)).toBeVisible();
    
    // Navigate back
    await authenticatedPage.click('button:has-text("Back")');
    await expect(authenticatedPage.locator(`text="${currentMonth}"`)).toBeVisible();
    
    // Go to today
    await authenticatedPage.click('button:has-text("Today")');
    await expect(authenticatedPage.locator(`text="${currentMonth}"`)).toBeVisible();
  });

  test('should return to list view', async ({ authenticatedPage }) => {
    await authenticatedPage.click('button:has-text("Calendar View")');
    await expect(authenticatedPage.locator('.rbc-calendar')).toBeVisible();
    
    // Return to list view
    await authenticatedPage.click('button:has-text("List View")');
    
    // Check that list view is displayed
    await expect(authenticatedPage.locator('h2:has-text("Events")')).toBeVisible();
    await expect(authenticatedPage.locator('.rbc-calendar')).not.toBeVisible();
  });

  test('should open existing event for editing', async ({ authenticatedPage }) => {
    // First create an event
    await authenticatedPage.click('button:has-text("New Event")');
    await authenticatedPage.fill('input[name="title"]', 'Edit Test Event');
    await authenticatedPage.click('button:has-text("Create Event")');
    await expect(authenticatedPage.locator('text="Create New Event"')).not.toBeVisible();
    
    // Go to calendar view
    await authenticatedPage.click('button:has-text("Calendar View")');
    
    // Click on the event
    await authenticatedPage.click('.rbc-event:has-text("Edit Test Event")');
    
    // Check that edit form opens
    await expect(authenticatedPage.locator('text="Edit Event"')).toBeVisible();
    await expect(authenticatedPage.locator('input[name="title"]')).toHaveValue('Edit Test Event');
    
    // Update the event
    await authenticatedPage.fill('input[name="title"]', 'Updated Calendar Event');
    await authenticatedPage.click('button:has-text("Update Event")');
    
    // Check that event is updated on calendar
    await expect(authenticatedPage.locator('.rbc-event:has-text("Updated Calendar Event")')).toBeVisible();
  });
});