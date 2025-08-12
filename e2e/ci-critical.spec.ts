import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth-helpers';

/**
 * Critical Path E2E Tests for CI
 * Combines essential tests from multiple test suites
 * Focused on core functionality that must work in production
 */

// Type definition for test data
interface TestData {
  username: string;
  email: string;
  password: string;
  todoTitle: string;
  noteTitle: string;
}

// Helper function to generate unique test data
function getTestData(): TestData {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.random().toString(36).substring(2, 5);
  const uniqueId = `${timestamp}${random}`;
  return {
    username: `user${uniqueId}`,
    email: `user${uniqueId}@test.com`,
    password: 'Test123456!',
    todoTitle: `Todo ${uniqueId}`,
    noteTitle: `Note ${uniqueId}`,
  };
}

test.describe('CI Critical Path Tests', () => {
  test.setTimeout(60000);

  test('Health Check: API should be accessible', async ({ request }) => {
    const apiUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8787';
    const response = await request.get(`${apiUrl}/health`);
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
    const credentials = await registerAndLogin(page);
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole('heading', { name: /Welcome back/i, level: 1 })).toBeVisible();
  });

  test('Todo: Should create and manage todos', async ({ page }) => {
    const testData = getTestData();
    await registerAndLogin(page);
    
    // Navigate to todos
    await page.goto('/todos');
    await page.getByRole('heading', { name: /TODOs?/i, level: 1 }).waitFor({ timeout: 10000 });
    
    // Create todo
    await page.getByRole('button', { name: /Add Todo/i }).first().click();
    await page.waitForSelector('input[name="title"]', { state: 'visible' });
    
    await page.fill('input[name="title"]', testData.todoTitle);
    await page.fill('textarea[name="description"]', 'Test description for CI');
    await page.selectOption('select[name="priority"]', 'HIGH');
    
    // Submit and wait for creation
    const createPromise = page.waitForResponse(
      resp => resp.url().includes('/api/v1/todos') && resp.status() === 201,
      { timeout: 10000 }
    );
    await page.locator('form').getByRole('button', { name: /Add Todo/i }).click();
    await createPromise;
    
    // Verify todo appears
    await page.waitForSelector(`text="${testData.todoTitle}"`, { timeout: 10000 });
    await expect(page.locator(`text="${testData.todoTitle}"`)).toBeVisible();
    
    // Mark as complete
    const completeBtn = page.getByRole('button', { name: 'Mark complete' }).first();
    await completeBtn.waitFor({ state: 'visible' });
    await completeBtn.click();
    
    // Wait for the API response that updates the todo status
    await page.waitForResponse(
      resp => resp.url().includes('/api/v1/todos') && resp.status() === 200,
      { timeout: 5000 }
    );
    await expect(page.locator('span').filter({ hasText: 'Done' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('Note: Should create and view notes', async ({ page }) => {
    const testData = getTestData();
    await registerAndLogin(page);
    
    // Navigate to notes
    await page.goto('/notes');
    await page.waitForResponse(
      response => response.url().includes('/api/v1/notes') && response.status() === 200,
      { timeout: 10000 }
    );
    await page.getByRole('heading', { name: 'Notes', level: 1 }).waitFor({ timeout: 10000 });
    
    // Create note
    await page.getByRole('button', { name: 'New Note' }).click();
    await page.waitForSelector('input[placeholder="Enter note title"]', { state: 'visible' });
    
    await page.fill('input[placeholder="Enter note title"]', testData.noteTitle);
    await page.fill('textarea[placeholder="Enter note content"]', 'Test note content for CI');
    
    // Submit note
    const createButton = page.locator('button[type="submit"]', { hasText: 'Create' });
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    
    const createPromise = page.waitForResponse(
      response => response.url().includes('/api/v1/notes') && response.status() === 201,
      { timeout: 10000 }
    );
    await createButton.click();
    await createPromise;
    
    // Wait for modal to close and note to appear
    await page.waitForSelector('input[placeholder="Enter note title"]', { state: 'hidden', timeout: 10000 });
    // Wait for the notes list to refresh
    await page.waitForResponse(
      response => response.url().includes('/api/v1/notes') && response.status() === 200,
      { timeout: 5000 }
    ).catch((error) => {
      // Optional: notes might already be loaded
      console.log('Note refresh response not received (may already be loaded):', error.message);
    });
    
    // Verify note appears
    await page.locator('h3').filter({ hasText: testData.noteTitle }).waitFor({ timeout: 10000 });
    await expect(page.locator('h3').filter({ hasText: testData.noteTitle })).toBeVisible();
  });

  test('Navigation: Should navigate between main sections', async ({ page }) => {
    await registerAndLogin(page);
    
    // Test navigation to key sections
    const sections = [
      { link: 'Dashboard', url: /dashboard/ },
      { link: 'TODOs', url: /todos/ },
      { link: 'Calendar', url: /calendar/ },
      { link: 'Notes', url: /notes/ },
      { link: 'Goals', url: /goals/ }
    ];
    
    for (const section of sections) {
      await page.getByRole('link', { name: section.link }).first().click();
      await page.waitForURL(section.url, { timeout: 5000 });
      await expect(page).toHaveURL(section.url);
      
      // Verify page loaded by checking for a heading
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  test('Session: Should maintain session across page reloads', async ({ page }) => {
    await registerAndLogin(page);
    
    // Verify logged in
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Reload page
    await page.reload();
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole('heading', { name: /Welcome back/i, level: 1 })).toBeVisible();
  });

  test('Logout: Should logout successfully', async ({ page }) => {
    const testData = await registerAndLogin(page);
    
    // Wait for page to be fully loaded and interactive
    await page.waitForLoadState('networkidle');
    
    // Find and click user menu button (has username and chevron icon)
    const userMenuButton = page.locator('button').filter({ hasText: testData.username });
    await expect(userMenuButton).toBeVisible({ timeout: 10000 });
    await userMenuButton.click();
    
    // Wait for dropdown menu to appear
    const logoutButton = page.locator('button').filter({ hasText: /logout/i }).first();
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    
    // Set up promise to wait for navigation
    const navigationPromise = page.waitForURL(/\/$/, { timeout: 10000 });
    
    // Click logout button
    await logoutButton.click();
    
    // Wait for navigation to complete
    await navigationPromise;
    
    // Verify logout was successful
    await expect(page).toHaveURL(/\/$/);
    
    // Verify session is cleared by checking for landing page elements
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('text=/Get Started|Sign Up|Login/i')).toBeVisible();
    
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should be redirected away from dashboard
    await expect(page).not.toHaveURL(/.*dashboard/);
  });
});