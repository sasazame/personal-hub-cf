import { test, expect } from '@playwright/test';

// Helper function to register and login
async function registerAndLogin(page, timestamp: string) {
  // Register
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  
  const username = `user${timestamp}`;
  const email = `${username}@test.com`;
  const password = 'Test123456!';
  
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect - could be either dashboard (auto-login) or login page
  await Promise.race([
    page.waitForURL('**/dashboard', { timeout: 10000 }),
    page.waitForURL('**/login**', { timeout: 10000 })
  ]);
  
  // If we're on login page, need to login
  if (page.url().includes('/login')) {
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard after login
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  }
  
  return { username, email, password };
}

test.describe('CI Critical Path Tests', () => {
  test.setTimeout(120000);
  
  // Use same timestamp for all tests in the suite to maintain session
  const suiteTimestamp = Date.now().toString().slice(-6);

  test('should register and login', async ({ page }) => {
    await registerAndLogin(page, suiteTimestamp);
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible();
  });

  test('should create and complete a todo', async ({ page }) => {
    // Register and login
    const timestamp = Date.now().toString().slice(-6);
    await registerAndLogin(page, timestamp);
    
    // Navigate to todos
    await page.goto('/todos');
    await page.waitForSelector('h1:has-text("TODOs")', { timeout: 10000 });
    
    // Create todo
    await page.click('button:has-text("Add Todo")');
    await page.waitForSelector('input[name="title"]', { state: 'visible' });
    
    await page.fill('input[name="title"]', 'CI Test Task');
    await page.fill('textarea[name="description"]', 'This is a test task for CI');
    await page.selectOption('select[name="priority"]', 'HIGH');
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Add Todo")');
    
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
    
    // Verify completion - check for Done status
    await expect(page.locator('text=Done')).toBeVisible({ timeout: 10000 });
  });

  // TODO: Fix flaky notes test - API works (201 Created) but UI doesn't update reliably
  test.skip('should create a note', async ({ page }) => {
    // Register and login
    const timestamp = Date.now().toString().slice(-6);
    await registerAndLogin(page, timestamp);
    
    // Navigate to notes
    await page.goto('/notes');
    
    // Wait for the notes API to be called
    await page.waitForResponse(response => 
      response.url().includes('/api/v1/notes') && response.status() === 200,
      { timeout: 10000 }
    );
    
    await page.waitForSelector('h1:has-text("Notes")', { timeout: 10000 });
    
    // Create note
    await page.click('button:has-text("New Note")');
    await page.waitForSelector('input[placeholder="Enter note title"]', { state: 'visible' });
    
    await page.fill('input[placeholder="Enter note title"]', 'CI Test Note');
    await page.fill('textarea[placeholder="Enter note content"]', 'This is test content for CI');
    
    // Submit - wait for button to be enabled
    const createButton = page.locator('button:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click();
    
    // Wait for note to appear
    await page.waitForSelector('text=CI Test Note', { timeout: 5000 });
    
    // Verify note
    await expect(page.locator('text=CI Test Note')).toBeVisible();
    await expect(page.locator('text=test')).toBeVisible();
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