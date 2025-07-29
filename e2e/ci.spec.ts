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
    await page.fill('input[name="username"]', `todo${timestamp}`);
    await page.fill('input[name="email"]', `todo${timestamp}@test.com`);
    await page.fill('input[name="password"]', 'Test123456!');
    await page.fill('input[name="confirmPassword"]', 'Test123456!');
    await page.click('button[type="submit"]');
    
    // Navigate to todos
    await page.goto('/todos');
    
    // Create todo
    await page.fill('input[placeholder="新しいタスクを入力..."]', 'CI Test Task');
    await page.press('input[placeholder="新しいタスクを入力..."]', 'Enter');
    
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
    await page.fill('input[name="username"]', `note${timestamp}`);
    await page.fill('input[name="email"]', `note${timestamp}@test.com`);
    await page.fill('input[name="password"]', 'Test123456!');
    await page.fill('input[name="confirmPassword"]', 'Test123456!');
    await page.click('button[type="submit"]');
    
    // Navigate to notes
    await page.goto('/notes');
    
    // Create note
    await page.click('button:has-text("新規ノート")');
    await page.fill('input[placeholder="タイトルを入力..."]', 'CI Test Note');
    await page.fill('[contenteditable="true"]', 'This is a test note content');
    await page.click('button:has-text("保存")');
    
    // Verify note appears in list
    await expect(page.locator('text=CI Test Note')).toBeVisible();
  });

  test('should create a moment', async ({ page }) => {
    // Quick login
    const timestamp = Date.now().toString().slice(-6);
    await page.goto('/register');
    await page.fill('input[name="username"]', `moment${timestamp}`);
    await page.fill('input[name="email"]', `moment${timestamp}@test.com`);
    await page.fill('input[name="password"]', 'Test123456!');
    await page.fill('input[name="confirmPassword"]', 'Test123456!');
    await page.click('button[type="submit"]');
    
    // Navigate to moments
    await page.goto('/moments');
    
    // Create moment
    await page.fill('textarea[placeholder="いまなにしてる？"]', 'CI Test Moment');
    await page.press('textarea[placeholder="いまなにしてる？"]', 'Control+Enter');
    
    // Verify moment appears
    await expect(page.locator('text=CI Test Moment').first()).toBeVisible();
  });

  test('should create a pomodoro session', async ({ page }) => {
    // Quick login
    const timestamp = Date.now().toString().slice(-6);
    await page.goto('/register');
    await page.fill('input[name="username"]', `pomo${timestamp}`);
    await page.fill('input[name="email"]', `pomo${timestamp}@test.com`);
    await page.fill('input[name="password"]', 'Test123456!');
    await page.fill('input[name="confirmPassword"]', 'Test123456!');
    await page.click('button[type="submit"]');
    
    // Navigate to pomodoro
    await page.goto('/pomodoro');
    
    // Start session
    await page.click('button:has-text("セッションを開始")');
    
    // Verify timer appears
    await expect(page.locator('[data-testid="pomodoro-timer"]')).toBeVisible();
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('25:00');
  });

  test('should navigate between main pages', async ({ page }) => {
    // Quick login
    const timestamp = Date.now().toString().slice(-6);
    await page.goto('/register');
    await page.fill('input[name="username"]', `nav${timestamp}`);
    await page.fill('input[name="email"]', `nav${timestamp}@test.com`);
    await page.fill('input[name="password"]', 'Test123456!');
    await page.fill('input[name="confirmPassword"]', 'Test123456!');
    await page.click('button[type="submit"]');
    
    // Test navigation
    const pages = [
      { link: 'TODOs', url: '/todos', heading: 'TODOリスト' },
      { link: 'ノート', url: '/notes', heading: 'ノート' },
      { link: 'モーメント', url: '/moments', heading: 'モーメント' },
      { link: 'カレンダー', url: '/calendar', heading: 'カレンダー' },
      { link: '目標', url: '/goals', heading: '目標管理' },
      { link: 'ポモドーロ', url: '/pomodoro', heading: 'ポモドーロタイマー' },
      { link: '分析', url: '/analytics', heading: '分析ダッシュボード' },
    ];
    
    for (const pageInfo of pages) {
      await page.click(`a:has-text("${pageInfo.link}")`);
      await expect(page).toHaveURL(pageInfo.url);
      await expect(page.locator('main h1').first()).toContainText(pageInfo.heading);
    }
  });
});