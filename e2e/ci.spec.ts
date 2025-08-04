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
    
    // Wait for dashboard after login
    await page.waitForURL('**/dashboard', { timeout: 5000 });
  }
  
  // Wait a bit for cookies to be properly set and reload to ensure they're accessible
  await page.waitForTimeout(500);
  
  // Force a page reload to ensure cookies are properly loaded
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  // Debug: Check if CSRF cookie is set
  const cookies = await page.context().cookies();
  const csrfCookie = cookies.find(c => c.name === 'csrf-token');
  console.log('CSRF Cookie after login:', csrfCookie);
  
  // Ensure CSRF token is cached in frontend
  await page.evaluate(() => {
    // Import the csrf module and set the cached token
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf-token') {
        // Force update the cached token by calling the setCachedCSRFToken function
        window.localStorage.setItem('csrf-token-cache', decodeURIComponent(value));
        return;
      }
    }
  });
  
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
    
    // Wait for initial notes load
    await page.waitForResponse(response => 
      response.url().includes('/api/v1/notes') && response.status() === 200,
      { timeout: 5000 }
    );
    
    await page.waitForSelector('h1:has-text("Notes")', { timeout: 5000 });
    
    // Create note
    await page.click('button:has-text("New Note")');
    await page.waitForSelector('input[placeholder="Enter note title"]', { state: 'visible' });
    
    await page.fill('input[placeholder="Enter note title"]', 'CI Test Note');
    await page.fill('textarea[placeholder="Enter note content"]', 'This is test content for CI');
    
    // Submit - wait for button to be enabled
    const createButton = page.locator('button:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    
    // Debug: Check if CSRF token is available in page context
    const csrfTokenFromPage = await page.evaluate(() => {
      // Try to get CSRF token from cookie
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrf-token') {
          return decodeURIComponent(value);
        }
      }
      return null;
    });
    console.log('CSRF Token from page context:', csrfTokenFromPage);
    
    // Set up request/response listeners before clicking create
    let capturedResponse: any;
    
    // Listen for the request to check headers
    page.on('request', request => {
      if (request.url().includes('/api/v1/notes') && request.method() === 'POST') {
        console.log('Request headers:', request.headers());
      }
    });
    
    const createResponsePromise = page.waitForResponse(async response => {
      if (response.url().includes('/api/v1/notes')) {
        console.log(`Response: ${response.url()} - Status: ${response.status()}`);
        if (response.status() !== 201) {
          const body = await response.text().catch(() => 'Could not read body');
          console.log(`Response body: ${body}`);
          capturedResponse = { status: response.status(), body };
        }
        return response.status() === 201;
      }
      return false;
    }, { timeout: 5000 });
    
    // Click create button
    console.log('Clicking create button...');
    await createButton.click();
    
    // Wait for the create response
    console.log('Waiting for create response...');
    try {
      await createResponsePromise;
    } catch (error) {
      if (capturedResponse) {
        throw new Error(`API returned ${capturedResponse.status}: ${capturedResponse.body}`);
      }
      throw error;
    }
    
    // Now wait for the refresh response after creation
    const refreshResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/notes') && response.status() === 200,
      { timeout: 5000 }
    );
    await refreshResponsePromise;
    
    // Wait for modal to close
    await page.waitForSelector('input[placeholder="Enter note title"]', { state: 'hidden', timeout: 5000 });
    
    // Wait a bit for React to update the DOM after modal closes
    await page.waitForTimeout(1000);
    
    // Wait for note to appear with more specific selector
    await page.waitForSelector('h3:has-text("CI Test Note")', { timeout: 5000 });
    
    // Verify note appears in the list
    const noteTitle = page.locator('h3:has-text("CI Test Note")');
    await expect(noteTitle).toBeVisible();
    
    // Verify the note content preview is visible - use more specific selector
    const noteContent = page.locator('.text-sm.text-gray-600.dark\\:text-gray-400:has-text("This is test content for CI")');
    await expect(noteContent).toBeVisible();
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