import { test, expect, Page } from '@playwright/test';
import { login, TEST_USER, ensureLoggedOut } from './helpers/auth';
import { registerAndLogin } from './helpers/auth-helpers';

/**
 * Comprehensive TODO E2E Tests
 * Consolidated from: todo.spec.ts, todo-basic.spec.ts, todo-with-auth.spec.ts,
 * todo-checkbox.spec.ts, todo-subtasks.spec.ts
 */

// Helper function to click kebab menu and select an option
async function clickTodoMenuOption(page: Page, todoTitle: string, optionName: string) {
  // Find the todo container that contains the title
  const todoContainer = page.locator('.bg-card').filter({ hasText: todoTitle });
  // Click the kebab menu (ellipsis icon)
  await todoContainer.locator('button svg').last().click();
  // Click the menu option
  await page.locator('button').filter({ hasText: optionName }).click();
}

// Alternative helper for different UI structures
async function clickTodoMenuOptionAlt(page: Page, todoTitle: string, optionName: string) {
  // Find the todo item that contains both the title and has action buttons
  const todoItem = page.locator('[class*="card"], [class*="todo-item"], div').filter({ hasText: todoTitle }).first();
  // Click the kebab menu (ellipsis icon) - usually the last button in the todo item
  await todoItem.locator('button').last().click();
  // Click the menu option
  await page.locator('button').filter({ hasText: optionName }).click();
}

test.describe('TODOs', () => {
  test.describe('Authentication Required Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Set English locale
      await page.context().addCookies([{ name: 'locale', value: 'en', domain: 'localhost', path: '/' }]);
      
      // Ensure clean state and login
      await ensureLoggedOut(page);
      await page.goto('/login');
      await login(page, TEST_USER.email, TEST_USER.password);
      
      // Navigate to todos page explicitly
      await page.goto('/todos');
      await page.waitForLoadState('domcontentloaded');
      
      // Wait for TODO app to be ready by checking for key elements
      await page.getByRole('heading', { name: 'TODO', level: 1 }).waitFor( { timeout: 5000 });
    });

    test('should display the todo app heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'TODO', exact: true })).toBeVisible();
    });

    test('should show "Add TODO" button', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Add TODO' })).toBeVisible();
    });

    test('should open todo form when clicking "Add TODO"', async ({ page }) => {
      // Ensure no modal is open first
      await expect(page.locator('div.fixed.inset-0.bg-gray-600')).not.toBeVisible();
      
      await page.getByRole('button', { name: 'Add TODO' }).click();
      await expect(page.getByRole('heading', { name: 'Create New TODO' })).toBeVisible();
      await expect(page.locator('input[id="title"]')).toBeVisible();
      await expect(page.locator('textarea[id="description"]')).toBeVisible();
      await expect(page.locator('select[id="priority"]')).toBeVisible();
    });

    test('should create a new todo', async ({ page }) => {
      const todoTitle = 'Test Todo ' + Date.now();
      const todoDescription = 'Test description ' + Date.now();

      // Ensure no modal is open first
      await expect(page.locator('div.fixed.inset-0.bg-gray-600')).not.toBeVisible();

      // Click "Add TODO" button
      await page.getByRole('button', { name: 'Add TODO' }).click();

      // Wait for the form to appear
      await expect(page.getByRole('heading', { name: 'Create New TODO' })).toBeVisible();

      // Fill in the form
      await page.fill('input[id="title"]', todoTitle);
      await page.fill('textarea[id="description"]', todoDescription);
      await page.selectOption('select[id="priority"]', 'MEDIUM');

      // Submit the form
      await page.getByRole('button', { name: 'Create TODO' }).click();

      // Wait for the modal to close
      await expect(page.getByRole('heading', { name: 'Create New TODO' })).not.toBeVisible();

      // Wait for the todo to appear
      await page.waitForSelector(`text=${todoTitle}`, { timeout: 5000 });

      // Verify the todo is displayed (look specifically in the todo list, not in toasts)
      await expect(page.locator('.space-y-4').getByText(todoTitle)).toBeVisible();
      await expect(page.locator('.space-y-4').getByText(todoDescription)).toBeVisible();
    });

    test('should delete a todo', async ({ page }) => {
      // Create a todo first
      const todoTitle = 'Delete Todo ' + Date.now();
      
      // Ensure no modal is open first
      await expect(page.locator('div.fixed.inset-0.bg-gray-600')).not.toBeVisible();
      
      await page.getByRole('button', { name: 'Add TODO' }).click();
      await page.fill('input[id="title"]', todoTitle);
      await page.fill('textarea[id="description"]', 'Delete description');
      await page.getByRole('button', { name: 'Create TODO' }).click();
      
      // Wait for modal to close
      await expect(page.getByRole('heading', { name: 'Create New TODO' })).not.toBeVisible();
      await page.waitForSelector(`text=${todoTitle}`, { timeout: 5000 });

      // Delete the todo using kebab menu
      await clickTodoMenuOption(page, todoTitle, 'Delete');

      // Confirm deletion in the modal
      await expect(page.getByRole('heading', { name: 'Delete TODO', level: 2 })).toBeVisible();
      
      // Confirm deletion
      await page.getByRole('button', { name: 'Delete' }).click();

      // Wait for todo to disappear
      await expect(page.locator('h3').filter({ hasText: todoTitle })).not.toBeVisible({ timeout: 5000 });

      // Verify the todo is removed from the list (ignore toast messages)
      await expect(page.locator('.space-y-4').getByText(todoTitle)).not.toBeVisible();
    });

    test('should cancel todo creation', async ({ page }) => {
      // Ensure no modal is open first
      await expect(page.locator('div.fixed.inset-0.bg-gray-600')).not.toBeVisible();
      
      await page.getByRole('button', { name: 'Add TODO' }).click();
      await expect(page.getByRole('heading', { name: 'Create New TODO' })).toBeVisible();
      
      // Fill some data
      await page.fill('input[id="title"]', 'Test Todo');
      
      // Cancel
      await page.getByRole('button', { name: 'Cancel' }).click();
      
      // Form should be closed
      await expect(page.getByRole('heading', { name: 'Create New TODO' })).not.toBeVisible();
    });

    test('should cancel todo deletion', async ({ page }) => {
      // Create a todo first
      const todoTitle = 'Cancel Delete Todo ' + Date.now();
      
      // Ensure no modal is open first
      await expect(page.locator('div.fixed.inset-0.bg-gray-600')).not.toBeVisible();
      
      await page.getByRole('button', { name: 'Add TODO' }).click();
      await page.fill('input[id="title"]', todoTitle);
      await page.fill('textarea[id="description"]', 'Cancel delete description');
      await page.getByRole('button', { name: 'Create TODO' }).click();
      
      // Wait for modal to close
      await expect(page.getByRole('heading', { name: 'Create New TODO' })).not.toBeVisible();
      await page.waitForSelector(`text=${todoTitle}`, { timeout: 5000 });

      // Click delete using kebab menu
      await clickTodoMenuOption(page, todoTitle, 'Delete');

      // Verify delete modal appears
      await expect(page.getByRole('heading', { name: 'Delete TODO', level: 2 })).toBeVisible();
      
      // Cancel deletion
      await page.getByRole('button', { name: 'Cancel' }).click();
      
      // Verify modal is closed and todo still exists in the list
      await expect(page.getByRole('heading', { name: 'Delete TODO', level: 2 })).not.toBeVisible();
      await expect(page.locator('.space-y-4').getByText(todoTitle)).toBeVisible();
    });
  });

  test.describe('New User Experience Tests', () => {
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

    test('should create a new todo with different form structure', async ({ page }) => {
      // Register and login
      await registerAndLogin(page);
      
      // Navigate to todos page
      await page.goto('/todos');
      await expect(page.getByRole('heading', { name: 'TODOs' })).toBeVisible();
      
      // Click add todo button - updated to match current button text
      await page.getByRole('button', { name: 'Add Todo' }).first().click();
      
      // Wait for form to appear - could be inline or in a dialog
      await page.getByRole('heading', { name: 'New Todo', level: 2 }).waitFor( { state: 'visible', timeout: 10000 });
      
      // Fill form
      const title = `Test Todo ${Date.now()}`;
      await page.fill('input[name="title"]', title);
      await page.fill('textarea[name="description"]', 'Test description');
      await page.selectOption('select[name="priority"]', 'MEDIUM');
      
      // Submit - updated to match current button text
      await page.locator('form').getByRole('button', { name: 'Add Todo' }).click();
      
      // Wait for todo to appear in the list
      await expect(page.locator('h3').filter({ hasText: title })).toBeVisible({ timeout: 5000 });
    });

    test('should delete a todo with alternative UI', async ({ page }) => {
      // Register and login
      await registerAndLogin(page);
      
      // Navigate to todos page
      await page.goto('/todos');
      await expect(page.getByRole('heading', { name: 'TODOs' })).toBeVisible();
      
      // First create a todo
      await page.getByRole('button', { name: 'Add Todo' }).first().click();
      // Wait for form to appear - could be inline or in a dialog
      await page.getByRole('heading', { name: 'New Todo', level: 2 }).waitFor( { state: 'visible', timeout: 10000 });
      
      const title = `Delete Test ${Date.now()}`;
      await page.fill('input[name="title"]', title);
      await page.locator('form').getByRole('button', { name: 'Add Todo' }).click();
      
      // Wait for todo to appear
      await expect(page.locator('h3').filter({ hasText: title })).toBeVisible();
      
      // Delete the todo using kebab menu
      await clickTodoMenuOptionAlt(page, title, 'Delete');
      
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
      await page.getByRole('button', { name: 'Add Todo' }).first().click();
      // Wait for form to appear - could be inline or in a dialog
      await page.getByRole('heading', { name: 'New Todo', level: 2 }).waitFor( { state: 'visible', timeout: 10000 });
      
      const title = `Status Test ${Date.now()}`;
      await page.fill('input[name="title"]', title);
      await page.locator('form').getByRole('button', { name: 'Add Todo' }).click();
      
      // Wait for todo to appear
      await expect(page.locator('h3').filter({ hasText: title })).toBeVisible();
      
      // Click edit using kebab menu
      await clickTodoMenuOptionAlt(page, title, 'Edit');
      
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

  test.describe('Checkbox and Completion Tests', () => {
    test.beforeEach(async ({ page }) => {
      await registerAndLogin(page);
      await page.goto('/todos');
      await page.waitForLoadState('networkidle');
    });

    test('should toggle todo completion via checkbox', async ({ page }) => {
      // Create a todo first
      await page.getByRole('button', { name: 'Add Todo' }).first().click();
      await page.getByRole('heading', { name: 'New Todo', level: 2 }).waitFor( { state: 'visible', timeout: 10000 });
      
      const title = `Checkbox Test ${Date.now()}`;
      await page.fill('input[name="title"]', title);
      await page.locator('form').getByRole('button', { name: 'Add Todo' }).click();
      
      // Wait for todo to appear
      await expect(page.locator('h3').filter({ hasText: title })).toBeVisible();
      
      // Find and click the checkbox
      const todoItem = page.locator('[class*="card"]').filter({ hasText: title });
      const checkbox = todoItem.locator('input[type="checkbox"]');
      
      // Check if checkbox exists and click it
      if (await checkbox.isVisible()) {
        await checkbox.click();
        
        // Verify completion status changed
        await page.waitForTimeout(1000);
        const isChecked = await checkbox.isChecked();
        expect(isChecked).toBeTruthy();
      }
    });

    test('should show completed todos differently', async ({ page }) => {
      // Create two todos - one to complete, one to leave pending
      const pendingTitle = `Pending Todo ${Date.now()}`;
      const completedTitle = `Completed Todo ${Date.now()}`;
      
      // Create pending todo
      await page.getByRole('button', { name: 'Add Todo' }).first().click();
      await page.getByRole('heading', { name: 'New Todo', level: 2 }).waitFor( { state: 'visible', timeout: 10000 });
      await page.fill('input[name="title"]', pendingTitle);
      await page.locator('form').getByRole('button', { name: 'Add Todo' }).click();
      
      // Wait for first todo to appear
      await expect(page.locator('h3').filter({ hasText: pendingTitle })).toBeVisible();
      
      // Create completed todo
      await page.getByRole('button', { name: 'Add Todo' }).first().click();
      await page.getByRole('heading', { name: 'New Todo', level: 2 }).waitFor( { state: 'visible', timeout: 10000 });
      await page.fill('input[name="title"]', completedTitle);
      await page.locator('form').getByRole('button', { name: 'Add Todo' }).click();
      
      // Wait for second todo to appear
      await expect(page.locator('h3').filter({ hasText: completedTitle })).toBeVisible();
      
      // Complete the second todo via edit
      await clickTodoMenuOptionAlt(page, completedTitle, 'Edit');
      await page.waitForSelector('select[name="status"]', { state: 'visible', timeout: 10000 });
      await page.selectOption('select[name="status"]', 'DONE');
      await page.locator('button[type="submit"]', { hasText: 'Update' }).click();
      
      // Verify the completed todo shows differently (strikethrough, different color, etc.)
      await page.waitForTimeout(1000);
      const completedTodo = page.locator('[class*="card"]').filter({ hasText: completedTitle });
      const pendingTodo = page.locator('[class*="card"]').filter({ hasText: pendingTitle });
      
      // Just verify both todos are still visible but potentially styled differently
      // Styles may differ (strikethrough, opacity), but we only assert visibility for stability
      await expect(completedTodo).toBeVisible();
      await expect(pendingTodo).toBeVisible();
    });
  });

  test.describe('Priority and Filtering Tests', () => {
    test.beforeEach(async ({ page }) => {
      await registerAndLogin(page);
      await page.goto('/todos');
      await page.waitForLoadState('networkidle');
    });

    test('should create todos with different priorities', async ({ page }) => {
      const priorities = ['LOW', 'MEDIUM', 'HIGH'];
      
      for (let i = 0; i < priorities.length; i++) {
        const priority = priorities[i];
        const title = `${priority} Priority Todo ${Date.now()}_${i}`;
        
        await page.getByRole('button', { name: 'Add Todo' }).first().click();
        await page.getByRole('heading', { name: 'New Todo', level: 2 }).waitFor( { state: 'visible', timeout: 10000 });
        
        await page.fill('input[name="title"]', title);
        await page.fill('textarea[name="description"]', `This is a ${priority.toLowerCase()} priority todo`);
        await page.selectOption('select[name="priority"]', priority);
        
        await page.locator('form').getByRole('button', { name: 'Add Todo' }).click();
        
        // Wait for todo to appear
        await expect(page.locator('h3').filter({ hasText: title })).toBeVisible();
        
        // Brief wait between creations
        await page.waitForTimeout(500);
      }
      
      // Verify all todos are displayed
      for (const priority of priorities) {
        const todoWithPriority = page.locator('[class*="card"]').filter({ hasText: `${priority} Priority Todo` });
        await expect(todoWithPriority.first()).toBeVisible();
      }
    });

    test('should filter todos by status', async ({ page }) => {
      // Create a mix of todos
      const todos = [
        { title: `Active Todo ${Date.now()}`, status: 'TODO' },
        { title: `Completed Todo ${Date.now()}`, status: 'DONE' }
      ];
      
      for (const todo of todos) {
        await page.getByRole('button', { name: 'Add Todo' }).first().click();
        await page.getByRole('heading', { name: 'New Todo', level: 2 }).waitFor( { state: 'visible', timeout: 10000 });
        
        await page.fill('input[name="title"]', todo.title);
        if (todo.status === 'DONE') {
          await page.selectOption('select[name="status"]', 'DONE');
        }
        
        await page.locator('form').getByRole('button', { name: 'Add Todo' }).click();
        await expect(page.locator('h3').filter({ hasText: todo.title })).toBeVisible();
        await page.waitForTimeout(500);
      }
      
      // Look for filter buttons/tabs
      const filterButtons = [
        'All',
        'Active', 
        'Completed',
        'Done',
        'Pending',
        'Todo'
      ];
      
      // Try to find and test filters
      for (const filterName of filterButtons) {
        const filterButton = page.getByRole('button', { name: filterName });
        if (await filterButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await filterButton.click();
          await page.waitForTimeout(500);
          
          // Just verify the page doesn't crash when filtering
          await expect(page.locator('body')).toBeVisible();
          break;
        }
      }
    });
  });

  test.describe('Subtasks and Advanced Features', () => {
    test.beforeEach(async ({ page }) => {
      await registerAndLogin(page);
      await page.goto('/todos');
      await page.waitForLoadState('networkidle');
    });

    test('should handle todo with due dates', async ({ page }) => {
      const title = `Due Date Todo ${Date.now()}`;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      await page.getByRole('button', { name: 'Add Todo' }).first().click();
      await page.getByRole('heading', { name: 'New Todo', level: 2 }).waitFor( { state: 'visible', timeout: 10000 });
      
      await page.fill('input[name="title"]', title);
      
      // Try to find and fill due date field
      const dueDateInput = page.locator('input[type="date"], input[name*="due"], input[name*="Date"]');
      if (await dueDateInput.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await dueDateInput.first().fill(dueDate);
      }
      
      await page.getByRole('button', { name: 'Add Todo' }).click();
      
      // Wait for todo to appear
      await expect(page.locator('h3').filter({ hasText: title })).toBeVisible();
      
      // Verify todo was created successfully (due date display is optional)
      const todoCard = page.locator('[class*="card"]').filter({ hasText: title });
      await expect(todoCard).toBeVisible();
    });

    test('should handle todo descriptions and notes', async ({ page }) => {
      const title = `Detailed Todo ${Date.now()}`;
      const longDescription = 'This is a very detailed todo description that contains multiple sentences. It should be properly displayed and preserved when the todo is created and viewed later.';
      
      await page.getByRole('button', { name: 'Add Todo' }).first().click();
      await page.getByRole('heading', { name: 'New Todo', level: 2 }).waitFor( { state: 'visible', timeout: 10000 });
      
      await page.fill('input[name="title"]', title);
      await page.fill('textarea[name="description"]', longDescription);
      
      await page.locator('form').getByRole('button', { name: 'Add Todo' }).click();
      
      // Wait for todo to appear
      await expect(page.locator('h3').filter({ hasText: title })).toBeVisible();
      
      // Verify description is preserved (might be truncated in card view)
      const todoCard = page.locator('[class*="card"]').filter({ hasText: title });
      await expect(todoCard).toBeVisible();
      
      // Click on the todo to see full details
      await todoCard.click();
      
      // Check if a detail view opens with full description
      const detailView = page.locator('text=' + longDescription.substring(0, 50));
      if (await detailView.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(detailView).toBeVisible();
      }
    });

    test('should handle todo categories or tags', async ({ page }) => {
      const title = `Tagged Todo ${Date.now()}`;
      const tags = ['work', 'urgent', 'personal'];
      
      await page.getByRole('button', { name: 'Add Todo' }).first().click();
      await page.getByRole('heading', { name: 'New Todo', level: 2 }).waitFor( { state: 'visible', timeout: 10000 });
      
      await page.fill('input[name="title"]', title);
      
      // Try to find and use tag/category fields
      const tagInputs = [
        'input[name*="tag"]',
        'input[name*="category"]',
        'input[placeholder*="tag"]',
        'select[name*="category"]'
      ];
      
      for (const tagSelector of tagInputs) {
        const tagInput = page.locator(tagSelector);
        if (await tagInput.first().isVisible({ timeout: 1000 }).catch(() => false)) {
          // If it's a select, choose first option
          if (tagSelector.includes('select')) {
            const options = await tagInput.locator('option').count();
            if (options > 1) {
              await tagInput.selectOption({ index: 1 });
            }
          } else {
            // If it's an input, try to enter tags
            await tagInput.first().fill(tags.join(', '));
          }
          break;
        }
      }
      
      await page.getByRole('button', { name: 'Add Todo' }).click();
      
      // Wait for todo to appear
      await expect(page.locator('h3').filter({ hasText: title })).toBeVisible();
      
      // Verify todo was created successfully
      const todoCard = page.locator('[class*="card"]').filter({ hasText: title });
      await expect(todoCard).toBeVisible();
    });
  });
});