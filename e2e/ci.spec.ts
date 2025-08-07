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
    page.waitForURL('**/dashboard', { timeout: 5000 }),
    page.waitForURL('**/login**', { timeout: 5000 })
  ]);
  
  // If we're on login page, need to login
  if (page.url().includes('/login')) {
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    // Wait for the login API to succeed
    await page.waitForResponse(response =>
      response.url().endsWith('/api/v1/auth/login') && response.status() === 200
    );
    
    // Wait for dashboard after login
    await page.waitForURL('**/dashboard', { timeout: 5000 });
  }
  
  // Wait until the CSRF cookie is set in the browser
  await page.waitForFunction(() => document.cookie.includes('csrf-token'));
  
  
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
    const timestamp = Date.now().toString().slice(-6);
    await registerAndLogin(page, timestamp);
    
    // Navigate to notes
    await page.goto('/notes');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Notes")', { timeout: 10000 });
    
    // Create note
    await page.click('button:has-text("New Note")');
    await page.waitForSelector('input[placeholder="Enter note title"]', { state: 'visible', timeout: 10000 });
    
    await page.fill('input[placeholder="Enter note title"]', 'CI Test Note');
    await page.fill('textarea[placeholder="Enter note content"]', 'This is test content for CI');
    
    // Submit - wait for button to be enabled
    const createButton = page.locator('button[type="submit"]:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    
    // Click the submit button and wait for success toast
    await createButton.click();
    
    // Wait for success toast to appear
    await page.waitForSelector('text=Note created', { timeout: 10000 });
    
    // Wait for modal to close
    await page.waitForSelector('input[placeholder="Enter note title"]', { state: 'hidden', timeout: 10000 });
    
    // Wait for the note to appear in the list
    await page.waitForSelector('h3:has-text("CI Test Note")', { timeout: 15000 });
    
    // Verify note appears in the list
    const noteTitle = page.locator('h3:has-text("CI Test Note")');
    await expect(noteTitle).toBeVisible();
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