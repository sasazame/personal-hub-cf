import { test, expect } from '@playwright/test';

/**
 * Critical Path E2E Tests for CI
 * Combines essential tests from multiple test suites
 * Focused on core functionality that must work in production
 */

// Helper function to generate unique test data
function getTestData() {
  const timestamp = Date.now().toString().slice(-8);
  return {
    username: `user${timestamp}`,
    email: `user${timestamp}@test.com`,
    password: 'Test123456!',
    todoTitle: `Todo ${timestamp}`,
    noteTitle: `Note ${timestamp}`,
  };
}

// Helper to register and login
async function registerAndLogin(page, testData) {
  // Navigate to register page
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  
  // Fill registration form
  await page.fill('input[name="username"]', testData.username);
  await page.fill('input[name="email"]', testData.email);
  await page.fill('input[name="password"]', testData.password);
  await page.fill('input[name="confirmPassword"]', testData.password);
  
  // Submit registration
  await page.click('button[type="submit"]');
  
  // Wait for redirect - could be either dashboard (auto-login) or login page
  await Promise.race([
    page.waitForURL('**/dashboard', { timeout: 10000 }),
    page.waitForURL('**/login**', { timeout: 10000 })
  ]);
  
  // If we're on login page, need to login
  if (page.url().includes('/login')) {
    await page.fill('input[name="email"]', testData.email);
    await page.fill('input[name="password"]', testData.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  }
  
  // Wait for authentication to be established
  await page.waitForTimeout(1000);
  
  return testData;
}

test.describe('CI Critical Path Tests', () => {
  test.setTimeout(60000);

  test('Health Check: API should be accessible', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('Auth: Should show landing page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to landing page
    await expect(page).toHaveURL(/.*\/(landing)?$/);
    
    // Check for key landing page elements
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('text=/Get Started|Sign Up|Login/i')).toBeVisible();
  });

  test('Auth: Should register and login successfully', async ({ page }) => {
    const testData = getTestData();
    await registerAndLogin(page, testData);
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible();
  });

  test('Todo: Should create and manage todos', async ({ page }) => {
    const testData = getTestData();
    await registerAndLogin(page, testData);
    
    // Navigate to todos
    await page.goto('/todos');
    await page.waitForSelector('h1:has-text("TODOs")', { timeout: 10000 });
    
    // Create todo
    await page.click('button:has-text("Add Todo")');
    await page.waitForSelector('input[name="title"]', { state: 'visible' });
    
    await page.fill('input[name="title"]', testData.todoTitle);
    await page.fill('textarea[name="description"]', 'Test description for CI');
    await page.selectOption('select[name="priority"]', 'HIGH');
    
    // Submit and wait for creation
    const createPromise = page.waitForResponse(
      resp => resp.url().includes('/api/v1/todos') && resp.status() === 201,
      { timeout: 10000 }
    );
    await page.click('button[type="submit"]:has-text("Add Todo")');
    await createPromise;
    
    // Verify todo appears
    await page.waitForSelector(`text="${testData.todoTitle}"`, { timeout: 10000 });
    await expect(page.locator(`text="${testData.todoTitle}"`)).toBeVisible();
    
    // Mark as complete
    const completeBtn = page.getByRole('button', { name: 'Mark complete' }).first();
    await completeBtn.waitFor({ state: 'visible' });
    await completeBtn.click();
    
    // Wait for status update
    await page.waitForTimeout(1000);
    await expect(page.locator('span:has-text("Done")').first()).toBeVisible({ timeout: 10000 });
  });

  test('Note: Should create and view notes', async ({ page }) => {
    const testData = getTestData();
    await registerAndLogin(page, testData);
    
    // Navigate to notes
    await page.goto('/notes');
    await page.waitForResponse(
      response => response.url().includes('/api/v1/notes') && response.status() === 200,
      { timeout: 10000 }
    );
    await page.waitForSelector('h1:has-text("Notes")', { timeout: 10000 });
    
    // Create note
    await page.click('button:has-text("New Note")');
    await page.waitForSelector('input[placeholder="Enter note title"]', { state: 'visible' });
    
    await page.fill('input[placeholder="Enter note title"]', testData.noteTitle);
    await page.fill('textarea[placeholder="Enter note content"]', 'Test note content for CI');
    
    // Submit note
    const createButton = page.locator('button[type="submit"]:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    
    const createPromise = page.waitForResponse(
      response => response.url().includes('/api/v1/notes') && response.status() === 201,
      { timeout: 10000 }
    );
    await createButton.click();
    await createPromise;
    
    // Wait for modal to close and note to appear
    await page.waitForSelector('input[placeholder="Enter note title"]', { state: 'hidden', timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Verify note appears
    await page.waitForSelector(`h3:has-text("${testData.noteTitle}")`, { timeout: 10000 });
    await expect(page.locator(`h3:has-text("${testData.noteTitle}")`)).toBeVisible();
  });

  test('Navigation: Should navigate between main sections', async ({ page }) => {
    const testData = getTestData();
    await registerAndLogin(page, testData);
    
    // Test navigation to key sections
    const sections = [
      { link: 'Dashboard', url: /dashboard/ },
      { link: 'TODOs', url: /todos/ },
      { link: 'Calendar', url: /calendar/ },
      { link: 'Notes', url: /notes/ },
      { link: 'Goals', url: /goals/ }
    ];
    
    for (const section of sections) {
      await page.click(`a:has-text("${section.link}")`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(section.url);
      
      // Verify page loaded by checking for a heading
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  test('Session: Should maintain session across page reloads', async ({ page }) => {
    const testData = getTestData();
    await registerAndLogin(page, testData);
    
    // Verify logged in
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible();
  });

  test('Logout: Should logout successfully', async ({ page }) => {
    const testData = getTestData();
    await registerAndLogin(page, testData);
    
    // Find and click logout button
    const userMenuButton = page.locator('button').filter({ hasText: testData.username }).first();
    await userMenuButton.click();
    
    await page.click('button:has-text("Logout")');
    
    // Should redirect to landing/login page
    await page.waitForURL(url => url.pathname === '/' || url.pathname.includes('landing'), { timeout: 10000 });
    
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/(login|landing|$)/);
  });
});