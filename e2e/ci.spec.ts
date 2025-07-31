import { test, expect, Page } from '@playwright/test';

/**
 * CI-friendly E2E test suite
 * These tests are designed to run quickly in CI environments
 * They test critical user flows without exhaustive coverage
 */

async function handlePostRegistrationFlow(page: Page, timestamp: string, userType: string) {
  // Wait a bit for any navigation to start
  await page.waitForTimeout(2000);
  
  // Check current URL
  const currentUrl = page.url();
  console.log(`After registration, current URL: ${currentUrl}`);
  
  // If still on register page or redirected to login, login manually
  if (currentUrl.includes('/register') || currentUrl.includes('/login')) {
    console.log('Need to login after registration');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const email = `${userType}${timestamp}@test.com`;
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Test123456!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to appear
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  } else if (!currentUrl.includes('/dashboard')) {
    // If not on dashboard, navigate there
    await page.goto('/dashboard');
  }
  
  // Ensure we're on dashboard
  await expect(page).toHaveURL(/.*\/dashboard/);
}

test.describe('CI Critical Path Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set a shorter timeout for CI
    page.setDefaultTimeout(15000);
  });

  test('should verify backend is running', async ({ page }) => {
    // Check backend health endpoint
    const response = await page.request.get('http://localhost:8787/health');
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('should complete authentication flow', async ({ page }) => {
    // Test registration
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    const timestamp = Date.now().toString().slice(-6);
    await page.fill('input[name="username"]', `ciuser${timestamp}`);
    await page.fill('input[name="email"]', `ci${timestamp}@test.com`);
    await page.fill('input[name="password"]', 'Test123456!');
    await page.fill('input[name="confirmPassword"]', 'Test123456!');
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Use the helper function to handle post-registration flow
    await handlePostRegistrationFlow(page, timestamp, 'ci');
    
    // Handle both English and Japanese headings
    await expect(page.locator('main h1').first()).toContainText(/(Welcome back|おかえりなさい|ようこそ)/);
  });

  test('should create and complete a todo', async ({ page }) => {
    // Quick login
    const timestamp = Date.now().toString().slice(-6);
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="username"]', `todo${timestamp}`);
    await page.fill('input[name="email"]', `todo${timestamp}@test.com`);
    await page.fill('input[name="password"]', 'Test123456!');
    await page.fill('input[name="confirmPassword"]', 'Test123456!');
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Handle post-registration flow
    await handlePostRegistrationFlow(page, timestamp, 'todo');
    
    // Navigate to todos
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');
    
    // Create todo - try different selectors
    const addButton = page.locator('button').filter({ hasText: /Add Todo|新規作成|追加|TODO/ }).first();
    await addButton.click();
    
    // Wait for form to appear
    await page.waitForSelector('input[name="title"], input#title', { timeout: 5000 });
    
    // Fill in the form
    const titleInput = page.locator('input[name="title"], input#title').first();
    await titleInput.fill('CI Test Task');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Wait for todo to appear
    await page.waitForSelector('text=CI Test Task', { timeout: 5000 });
    
    // Verify todo appears
    await expect(page.locator('text=CI Test Task')).toBeVisible();
    
    // Complete todo - find checkbox near the text
    const todoItem = page.locator('text=CI Test Task');
    const checkbox = todoItem.locator('..').locator('input[type="checkbox"]').first();
    await checkbox.click();
    
    // Verify completion
    await expect(page.locator('.line-through')).toContainText('CI Test Task');
  });

  test('should create a note', async ({ page }) => {
    // Quick login
    const timestamp = Date.now().toString().slice(-6);
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="username"]', `note${timestamp}`);
    await page.fill('input[name="email"]', `note${timestamp}@test.com`);
    await page.fill('input[name="password"]', 'Test123456!');
    await page.fill('input[name="confirmPassword"]', 'Test123456!');
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Handle post-registration flow
    await handlePostRegistrationFlow(page, timestamp, 'note');
    
    // Navigate to notes
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');
    
    // Create note (handle both languages)
    await page.click('button:has-text("Create Note"), button:has-text("新規ノート"), button:has-text("新規作成")');
    
    // Wait for form to appear
    await page.waitForSelector('input[name="title"]');
    
    await page.fill('input[name="title"]', 'CI Test Note');
    await page.fill('textarea[name="content"]', 'This is a test note content');
    await page.click('button[type="submit"]');
    
    // Wait for note to appear
    await page.waitForSelector('text=CI Test Note');
    
    // Verify note appears in list
    await expect(page.locator('text=CI Test Note')).toBeVisible();
  });

  test('should create a moment', async ({ page }) => {
    // Quick login
    const timestamp = Date.now().toString().slice(-6);
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="username"]', `moment${timestamp}`);
    await page.fill('input[name="email"]', `moment${timestamp}@test.com`);
    await page.fill('input[name="password"]', 'Test123456!');
    await page.fill('input[name="confirmPassword"]', 'Test123456!');
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Handle post-registration flow
    await handlePostRegistrationFlow(page, timestamp, 'moment');
    
    // Navigate to moments
    await page.goto('/moments');
    await page.waitForLoadState('networkidle');
    
    // Create moment (handle both languages)
    const momentTextarea = await page.locator('textarea').first();
    await momentTextarea.fill('CI Test Moment');
    await momentTextarea.press('Control+Enter');
    
    // Wait for moment to appear
    await page.waitForSelector('text=CI Test Moment');
    
    // Verify moment appears
    await expect(page.locator('text=CI Test Moment').first()).toBeVisible();
  });

  test('should create a pomodoro session', async ({ page }) => {
    // Quick login
    const timestamp = Date.now().toString().slice(-6);
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="username"]', `pomo${timestamp}`);
    await page.fill('input[name="email"]', `pomo${timestamp}@test.com`);
    await page.fill('input[name="password"]', 'Test123456!');
    await page.fill('input[name="confirmPassword"]', 'Test123456!');
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Handle post-registration flow
    await handlePostRegistrationFlow(page, timestamp, 'pomo');
    
    // Navigate to pomodoro
    await page.goto('/pomodoro');
    await page.waitForLoadState('networkidle');
    
    // Start session (handle both languages)
    await page.click('button:has-text("Start"), button:has-text("開始")');
    
    // Verify timer appears
    await expect(page.locator('.text-6xl, .text-5xl, .text-4xl').first()).toBeVisible();
    await expect(page.locator('.text-6xl, .text-5xl, .text-4xl').first()).toContainText(/25:00|25分/);
  });

  test('should navigate between main pages', async ({ page }) => {
    // Quick login
    const timestamp = Date.now().toString().slice(-6);
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="username"]', `nav${timestamp}`);
    await page.fill('input[name="email"]', `nav${timestamp}@test.com`);
    await page.fill('input[name="password"]', 'Test123456!');
    await page.fill('input[name="confirmPassword"]', 'Test123456!');
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Handle post-registration flow
    await handlePostRegistrationFlow(page, timestamp, 'nav');
    
    // Test navigation
    const pages = [
      { link: 'TODOs', url: '/todos', heading: /(TODOs|タスク)/ },
      { link: 'Notes', url: '/notes', heading: /(Notes|ノート)/ },
      { link: 'Moments', url: '/moments', heading: /(Moments|モーメント)/ },
      { link: 'Calendar', url: '/calendar', heading: /(Calendar|カレンダー)/ },
      { link: 'Goals', url: '/goals', heading: /(Goals|目標)/ },
      { link: 'Pomodoro', url: '/pomodoro', heading: /(Pomodoro|ポモドーロ)/ },
      { link: 'Analytics', url: '/analytics', heading: /(Analytics|分析)/ },
    ];
    
    for (const pageInfo of pages) {
      await page.click(`a:has-text("${pageInfo.link}")`).catch(() => {
        // If English link not found, try clicking by URL
        return page.click(`a[href="${pageInfo.url}"]`);
      });
      await expect(page).toHaveURL(pageInfo.url);
      await expect(page.locator('main h1').first()).toContainText(pageInfo.heading);
    }
  });
});