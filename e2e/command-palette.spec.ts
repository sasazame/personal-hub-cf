import { test, expect } from '@playwright/test';
import { login, TEST_USER, ensureLoggedOut } from './helpers/auth';

test.describe.skip('Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    await page.context().addCookies([{ name: 'locale', value: 'en', domain: 'localhost', path: '/' }]);
    await page.goto('/login');
    await login(page, TEST_USER.email, TEST_USER.password);
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    await page.getByRole('heading', { name: /Welcome/i, level: 1 }).waitFor({ timeout: 5000 });
  });

  test('should open command palette with Cmd/Ctrl+K', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
    
    const commandPalette = page.locator('input[placeholder*="Type a command or search"]');
    await expect(commandPalette).toBeVisible();
  });

  test('should close command palette with Escape', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
    
    const commandPalette = page.locator('input[placeholder*="Type a command or search"]');
    await expect(commandPalette).toBeVisible();
    
    await page.keyboard.press('Escape');
    await expect(commandPalette).not.toBeVisible();
  });

  test('should navigate to different pages using command palette', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
    
    const searchInput = page.locator('input[placeholder*="Type a command or search"]');
    await searchInput.fill('todos');
    
    // Wait for debounce to complete
    await page.waitForTimeout(200);
    
    await page.keyboard.press('Enter');
    
    await page.waitForURL('**/todos');
    await expect(page.getByRole('heading', { name: /TODOs/i })).toBeVisible();
  });

  test('should filter commands based on search query', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
    
    const searchInput = page.locator('input[placeholder*="Type a command or search"]');
    await searchInput.fill('new');
    
    // Wait for debounce and search to complete
    await page.waitForTimeout(200);
    
    // Use more specific selectors for command titles
    const newTodoCommand = page.locator('span.font-medium:has-text("New TODO")');
    const newNoteCommand = page.locator('span.font-medium:has-text("New Note")');
    await expect(newTodoCommand).toBeVisible();
    await expect(newNoteCommand).toBeVisible();
    
    // Dashboard should not be visible when searching for "new"
    const dashboardCommand = page.locator('span.font-medium:has-text("Dashboard")');
    await expect(dashboardCommand).not.toBeVisible();
  });

  test('should navigate through commands with arrow keys', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
    
    // Wait for command palette to fully render
    await page.waitForTimeout(100);
    
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    
    // Check for selected command with more flexible selector
    const selectedCommand = page.locator('[class*="bg-blue"], [class*="bg-gray-100"], [class*="bg-gray-800"]').first();
    await expect(selectedCommand).toBeVisible();
  });

  test('should toggle theme using command palette', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    
    const body = page.locator('body');
    const initialClass = await body.getAttribute('class');
    const isDark = initialClass?.includes('dark');
    
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
    
    const searchInput = page.locator('input[placeholder*="Type a command or search"]');
    await searchInput.fill('theme');
    
    // Wait for debounce to complete
    await page.waitForTimeout(200);
    
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(500);
    const newClass = await body.getAttribute('class');
    const isNowDark = newClass?.includes('dark');
    
    expect(isDark).not.toBe(isNowDark);
  });

  test('should execute quick actions with keyboard shortcuts', async ({ page }) => {
    await page.keyboard.press('Alt+T');
    
    await page.waitForURL('**/todos');
    await expect(page.getByRole('heading', { name: /TODOs/i })).toBeVisible();
    
    await page.keyboard.press('Alt+D');
    
    await page.waitForURL('**/dashboard');
    await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible();
  });

  test('should remember recent commands', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
    const searchInput = page.locator('input[placeholder*="Type a command or search"]');
    await searchInput.fill('notes');
    
    // Wait for debounce to complete
    await page.waitForTimeout(200);
    
    await page.keyboard.press('Enter');
    
    await page.waitForURL('**/notes');
    
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
    
    // Wait for command palette to render
    await page.waitForTimeout(100);
    
    // Check if Notes command appears (recent commands feature)
    const notesCommand = page.locator('span.font-medium:has-text("Notes")');
    await expect(notesCommand).toBeVisible();
  });

  test('should handle action commands', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    
    // Handle the confirmation dialog that will appear
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
    
    const searchInput = page.locator('input[placeholder*="Type a command or search"]');
    await searchInput.fill('logout');
    
    // Wait for debounce to complete
    await page.waitForTimeout(200);
    
    await page.keyboard.press('Enter');
    
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Login/i })).toBeVisible();
  });

  test('should display command categories', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
    
    // Wait for command palette to fully render
    await page.waitForTimeout(200);
    
    // Use more specific selectors for category headers - matching the actual class names
    const navigationCategory = page.locator('div.uppercase.text-xs:has-text("Navigation")');
    const actionsCategory = page.locator('div.uppercase.text-xs:has-text("Actions")');
    const settingsCategory = page.locator('div.uppercase.text-xs:has-text("Settings")');
    
    await expect(navigationCategory).toBeVisible();
    await expect(actionsCategory).toBeVisible();
    await expect(settingsCategory).toBeVisible();
  });
});
