import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth-helpers';

test.describe('CI Critical Path Tests', () => {
  test.setTimeout(120000);

  test('should register and login', async ({ page }) => {
    await registerAndLogin(page);
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible();
  });

  test('should create and complete a todo', async ({ page }) => {
    // Register and login
    await registerAndLogin(page);
    
    // Navigate to todos
    await page.goto('/todos');
    await page.waitForSelector('h1:has-text("TODOs")', { timeout: 5000 });
    
    // Create todo
    await page.click('button:has-text("Add Todo")');
    await page.waitForSelector('input[name="title"]', { state: 'visible' });
    
    await page.fill('input[name="title"]', 'CI Test Task');
    await page.fill('textarea[name="description"]', 'This is a test task for CI');
    await page.selectOption('select[name="priority"]', 'HIGH');
    
    // Submit form and wait for response
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/v1/todos'), { timeout: 10000 }),
      page.click('button[type="submit"]:has-text("Add Todo")')
    ]);
    
    // Check response for debugging
    if (response.status() !== 201) {
      const responseBody = await response.text();
      console.error('Failed to create todo:', response.status(), responseBody);
    }
    
    // Wait for todo to appear
    await page.waitForSelector('text=CI Test Task', { timeout: 5000 });
    
    // Verify todo appears
    await expect(page.locator('text=CI Test Task')).toBeVisible();
    
    // Wait a bit for the UI to be fully interactive
    await page.waitForTimeout(1000);
    
    // Complete todo - wait for button to be enabled and click
    const markCompleteBtn = page.getByRole('button', { name: 'Mark complete' });
    await markCompleteBtn.waitFor({ state: 'visible' });
    await markCompleteBtn.click();
    
    // Wait for status update with longer timeout
    await page.waitForTimeout(2000);
    
    // Verify completion - check for Done status badge with more specific selector
    // The status is inside a span with rounded-full class
    await expect(page.locator('span.rounded-full:has-text("Done")')).toBeVisible({ timeout: 5000 });
  });

  test('should create a note', async ({ page }) => {
    // Register and login
    await registerAndLogin(page);
    
    // Navigate to notes
    await page.goto('/notes');
    
    // Wait for page to load with network idle
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Notes")', { timeout: 10000 });
    
    // Create note - use more robust selector
    const newNoteButton = page.locator('button:has-text("New Note"), button:has-text("Create Note"), button:has-text("Add Note")');
    await expect(newNoteButton).toBeVisible({ timeout: 10000 });
    await newNoteButton.click();
    
    // Wait for modal/form to appear with more flexible selectors
    await page.waitForSelector('input[placeholder*="title" i], input[name="title"]', { state: 'visible', timeout: 10000 });
    
    // Fill the form fields with more flexible selectors
    const titleInput = page.locator('input[placeholder*="title" i], input[name="title"]').first();
    const contentInput = page.locator('textarea[placeholder*="content" i], textarea[name="content"], textarea[name="description"]').first();
    
    await titleInput.fill('CI Test Note');
    await contentInput.fill('This is test content for CI');
    
    // Wait a moment for form validation
    await page.waitForTimeout(500);
    
    // Submit - wait for button to be enabled with more flexible selector
    const createButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
    await expect(createButton.first()).toBeEnabled({ timeout: 5000 });
    
    // Click the submit button and wait for navigation or API response
    await Promise.race([
      // Option 1: Wait for API response
      Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/v1/notes') && (resp.status() === 201 || resp.status() === 200), { timeout: 15000 }),
        createButton.first().click()
      ]),
      // Option 2: Wait for navigation/modal close
      Promise.all([
        page.waitForSelector('input[placeholder*="title" i], input[name="title"]', { state: 'hidden', timeout: 15000 }),
        createButton.first().click()
      ])
    ]).catch(async () => {
      // Fallback: Just click and wait
      await createButton.first().click();
      await page.waitForTimeout(2000);
    });
    
    // Give UI time to update
    await page.waitForTimeout(1000);
    
    // Wait for the note to appear in the list with more flexible selectors
    const noteElement = page.locator('text="CI Test Note", h3:has-text("CI Test Note"), [class*="title"]:has-text("CI Test Note")');
    await expect(noteElement.first()).toBeVisible({ timeout: 15000 });
  });

  test('should navigate between sections', async ({ page }) => {
    // Register and login
    const timestamp = Date.now().toString().slice(-6);
    await registerAndLogin(page, timestamp);
    
    // Start on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Navigate to different sections
    const sections = [
      { link: 'TODOs', url: /todos/ },
      { link: 'Calendar', url: /calendar/ },
      { link: 'Notes', url: /notes/ },
      { link: 'Analytics', url: /analytics/ }
    ];
    
    for (const section of sections) {
      await page.click(`a:has-text("${section.link}")`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(section.url);
    }
  });
});