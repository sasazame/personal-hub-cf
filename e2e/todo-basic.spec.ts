import { test, expect, Page } from '@playwright/test';

// Helper function to click kebab menu and select an option
async function clickTodoMenuOption(page: Page, todoTitle: string, optionName: string) {
  const todoContainer = page.locator('.bg-card').filter({ hasText: todoTitle });
  // Click the kebab menu (ellipsis icon)
  await todoContainer.locator('button svg').last().click();
  // Click the menu option
  await page.locator('button').filter({ hasText: optionName }).click();
}

// Helper function to register and login
async function registerAndLogin(page: Page) {
  const timestamp = Date.now().toString().slice(-6);
  const username = `user${timestamp}`;
  const email = `${username}@test.com`;
  const password = 'Test123456!';
  
  // Register
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard or login
  await Promise.race([
    page.waitForURL('**/dashboard', { timeout: 5000 }),
    page.waitForURL('**/login**', { timeout: 5000 })
  ]);
  
  // If on login page, login
  if (page.url().includes('/login')) {
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
  }
  
  return { username, email, password };
}

test.describe('Todo Basic Operations', () => {

  test('should display empty state for new user', async ({ page }) => {
    // Register and login
    await registerAndLogin(page);
    
    // Navigate to todos page
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'TODOs' })).toBeVisible();
    
    // Check for empty state message - updated to match current translation
    await expect(page.locator('text=No TODOs found')).toBeVisible();
  });

  test('should create a new todo', async ({ page }) => {
    // Register and login
    const testUser = await registerAndLogin(page);
    
    // Navigate to todos page
    await page.goto('/todos');
    await expect(page.getByRole('heading', { name: 'TODOs' })).toBeVisible();
    
    // Click add todo button - updated to match current button text
    await page.click('button:has-text("Add Todo")');
    
    // Wait for form to appear
    await page.waitForSelector('[role="dialog"]');
    
    // Fill form
    const title = `Test Todo ${Date.now()}`;
    await page.fill('input[name="title"]', title);
    await page.fill('textarea[name="description"]', 'Test description');
    await page.selectOption('select[name="priority"]', 'MEDIUM');
    
    // Submit - updated to match current button text
    await page.click('button[type="submit"]:has-text("Add Todo")');
    
    // Wait for todo to appear in the list
    await expect(page.locator('h3').filter({ hasText: title })).toBeVisible({ timeout: 5000 });
  });

  test('should delete a todo', async ({ page }) => {
    // Register and login
    await registerAndLogin(page);
    
    // Navigate to todos page
    await page.goto('/todos');
    await expect(page.getByRole('heading', { name: 'TODOs' })).toBeVisible();
    
    // First create a todo
    await page.click('button:has-text("Add Todo")');
    await page.waitForSelector('[role="dialog"]');
    
    const title = `Delete Test ${Date.now()}`;
    await page.fill('input[name="title"]', title);
    await page.click('button[type="submit"]:has-text("Add Todo")');
    
    // Wait for todo to appear
    await expect(page.locator('h3').filter({ hasText: title })).toBeVisible();
    
    // Delete the todo using kebab menu
    await clickTodoMenuOption(page, title, 'Delete');
    
    // Confirm deletion - updated to match current modal
    await expect(page.locator('text=Are you sure')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();
    
    // Wait for todo to disappear
    await expect(page.locator('h3').filter({ hasText: title })).not.toBeVisible({ timeout: 5000 });
  });

  test('should update todo status', async ({ page }) => {
    // Register and login
    await registerAndLogin(page);
    
    // Navigate to todos page
    await page.goto('/todos');
    await expect(page.getByRole('heading', { name: 'TODOs' })).toBeVisible();
    
    // First create a todo
    await page.click('button:has-text("Add Todo")');
    await page.waitForSelector('[role="dialog"]');
    
    const title = `Status Test ${Date.now()}`;
    await page.fill('input[name="title"]', title);
    await page.click('button[type="submit"]:has-text("Add Todo")');
    
    // Wait for todo to appear
    await expect(page.locator('h3').filter({ hasText: title })).toBeVisible();
    
    // Click edit using kebab menu
    await clickTodoMenuOption(page, title, 'Edit');
    
    // Wait for edit form - updated to match current modal
    await expect(page.locator('h2:has-text("Edit TODO")')).toBeVisible();
    
    // Change status
    await page.selectOption('select[name="status"]', 'DONE');
    
    // Save - updated to match current button text
    await page.click('button:has-text("Update TODO")');
    
    // Verify status changed - look for 'Done' status badge
    await expect(page.locator('span:has-text("Done")').first()).toBeVisible({ timeout: 5000 });
  });
});