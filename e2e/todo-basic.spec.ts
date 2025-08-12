import { test, expect, Page } from '@playwright/test';
import { registerAndLogin } from './helpers/auth-helpers';

// Helper function to click kebab menu and select an option
async function clickTodoMenuOption(page: Page, todoTitle: string, optionName: string) {
  // Find the todo item that contains both the title and has action buttons
  const todoItem = page.locator('[class*="card"], [class*="todo-item"], div').filter({ hasText: todoTitle }).first();
  // Click the kebab menu (ellipsis icon) - usually the last button in the todo item
  await todoItem.locator('button').last().click();
  // Click the menu option
  await page.locator('button').filter({ hasText: optionName }).click();
}

test.describe('Todo Basic Operations', () => {

  test('should display empty state for new user', async ({ page }) => {
    // Register and login
    await registerAndLogin(page);
    
    // Navigate to todos page
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /TODOs?/i })).toBeVisible();
    
    // Check for empty state message - updated to match current translation
    await expect(page.locator('text=No TODOs found')).toBeVisible();
  });

  test('should create a new todo', async ({ page }) => {
    // Register and login
    const testUser = await registerAndLogin(page);
    
    // Navigate to todos page
    await page.goto('/todos');
    await expect(page.getByRole('heading', { name: /TODOs?/i })).toBeVisible();
    
    // Click add todo button - updated to match current button text
    await page.getByRole('button', { name: 'Add Todo' }).first().click();
    
    // Wait for form to appear
    // Wait for form to appear - could be inline or in a dialog
    await page.getByRole('heading', { name: 'New Todo', level: 2 }).waitFor({ state: 'visible', timeout: 10000 });
    
    // Fill form
    const title = `Test Todo ${Date.now()}`;
    await page.fill('input[name="title"]', title);
    await page.fill('textarea[name="description"]', 'Test description');
    await page.selectOption('select[name="priority"]', 'MEDIUM');
    
    // Submit - updated to match current button text (submit button in form)
    await page.locator('form').getByRole('button', { name: 'Add Todo' }).click();
    
    // Wait for todo to appear in the list
    await expect(page.locator('h3').filter({ hasText: title })).toBeVisible({ timeout: 5000 });
  });

  test('should delete a todo', async ({ page }) => {
    // Register and login
    await registerAndLogin(page);
    
    // Navigate to todos page
    await page.goto('/todos');
    await expect(page.getByRole('heading', { name: /TODOs?/i })).toBeVisible();
    
    // First create a todo
    await page.getByRole('button', { name: 'Add Todo' }).first().click();
    // Wait for form to appear - could be inline or in a dialog
    await page.getByRole('heading', { name: 'New Todo', level: 2 }).waitFor({ state: 'visible', timeout: 10000 });
    
    const title = `Delete Test ${Date.now()}`;
    await page.fill('input[name="title"]', title);
    await page.locator('form').getByRole('button', { name: 'Add Todo' }).click();
    
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
    await expect(page.getByRole('heading', { name: /TODOs?/i })).toBeVisible();
    
    // First create a todo
    await page.getByRole('button', { name: 'Add Todo' }).first().click();
    // Wait for form to appear - could be inline or in a dialog
    await page.getByRole('heading', { name: 'New Todo', level: 2 }).waitFor({ state: 'visible', timeout: 10000 });
    
    const title = `Status Test ${Date.now()}`;
    await page.fill('input[name="title"]', title);
    await page.locator('form').getByRole('button', { name: 'Add Todo' }).click();
    
    // Wait for todo to appear
    await expect(page.locator('h3').filter({ hasText: title })).toBeVisible();
    
    // Click edit using kebab menu
    await clickTodoMenuOption(page, title, 'Edit');
    
    // Wait for edit form
    await page.waitForSelector('select[name="status"]', { state: 'visible', timeout: 10000 });
    
    // Change status
    await page.selectOption('select[name="status"]', 'DONE');
    
    // Save - updated to match current button text
    const updateButton = page.locator('button[type="submit"]', { hasText: 'Update' });
    await updateButton.click();
    
    // Wait for modal to close and verify status changed
    await page.waitForTimeout(1000);
    await expect(page.locator('span.rounded-full').filter({ hasText: 'Done' })).toBeVisible({ timeout: 5000 });
  });
});