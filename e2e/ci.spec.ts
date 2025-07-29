import { test, expect } from '@playwright/test';

/**
 * CI-friendly E2E test suite
 * These tests are designed to run quickly in CI environments
 * They test critical user flows without exhaustive coverage
 */

test.describe('CI Critical Path Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set a shorter timeout for CI
    page.setDefaultTimeout(10000);
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
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('main h1').first()).toContainText('Welcome back');
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
    await page.click('button[type="submit"]');
    
    // Navigate to todos
    await page.goto('/todos');
    
    // Create todo - click Add Todo button
    await page.click('button:has-text("Add Todo")');
    
    // Fill in the form
    await page.fill('input#title', 'CI Test Task');
    await page.click('button[type="submit"]');
    
    // Verify todo appears
    await expect(page.locator('text=CI Test Task')).toBeVisible();
    
    // Complete todo
    await page.click('input[type="checkbox"]');
    
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
    await page.click('button[type="submit"]');
    
    // Navigate to notes
    await page.goto('/notes');
    
    // Create note
    await page.click('button:has-text("Create Note"), button:has-text("新規ノート")');
    await page.fill('input[name="title"]', 'CI Test Note');
    await page.fill('textarea[name="content"]', 'This is a test note content');
    await page.click('button[type="submit"]');
    
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
    await page.click('button[type="submit"]');
    
    // Navigate to moments
    await page.goto('/moments');
    
    // Create moment
    await page.fill('textarea[placeholder*="What"], textarea[placeholder="いまなにしてる？"]', 'CI Test Moment');
    await page.press('textarea[placeholder*="What"], textarea[placeholder="いまなにしてる？"]', 'Control+Enter');
    
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
    await page.click('button[type="submit"]');
    
    // Navigate to pomodoro
    await page.goto('/pomodoro');
    
    // Start session
    await page.click('button:has-text("Start Session"), button:has-text("セッションを開始")');
    
    // Verify timer appears
    await expect(page.locator('.text-6xl').first()).toBeVisible();
    await expect(page.locator('.text-6xl').first()).toContainText('25:00');
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
    await page.click('button[type="submit"]');
    
    // Test navigation
    const pages = [
      { link: 'TODOs', url: '/todos', heading: 'TODOs' },
      { link: 'Notes', url: '/notes', heading: 'Notes' },
      { link: 'Moments', url: '/moments', heading: 'Moments' },
      { link: 'Calendar', url: '/calendar', heading: 'Calendar' },
      { link: 'Goals', url: '/goals', heading: 'Goals' },
      { link: 'Pomodoro', url: '/pomodoro', heading: 'Pomodoro' },
      { link: 'Analytics', url: '/analytics', heading: 'Analytics' },
    ];
    
    for (const pageInfo of pages) {
      await page.click(`a:has-text("${pageInfo.link}")`);
      await expect(page).toHaveURL(pageInfo.url);
      await expect(page.locator('main h1').first()).toContainText(pageInfo.heading);
    }
  });
});