import { test, expect } from './fixtures/base-test';
import { login, clearAllTodos } from './helpers/auth';

// Test constants
const DAYS_IN_FUTURE = 7;

test.describe('Todo CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await clearAllTodos(page);
  });

  test('should create a new todo', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/');
    
    // Click the Add Todo button
    await page.click('[data-testid="add-todo-button"]');
    
    // Fill in the todo form
    await page.fill('[data-testid="todo-title-input"]', 'Test Todo Item');
    await page.fill('[data-testid="todo-description-input"]', 'This is a test description');
    await page.selectOption('[data-testid="todo-priority-select"]', 'HIGH');
    
    // Submit the form
    await page.click('[data-testid="todo-submit-button"]');
    
    // Verify the todo appears in the list
    const todoItem = page.locator('[data-testid^="todo-item-"]').first();
    await expect(todoItem).toBeVisible();
    await expect(todoItem.locator('[data-testid^="todo-title-"]')).toContainText('Test Todo Item');
    await expect(todoItem.locator('[data-testid^="todo-description-"]')).toContainText('This is a test description');
    await expect(todoItem.locator('[data-testid^="todo-priority-"]')).toContainText('HIGH');
    // Using a more specific selector for status display
    await expect(todoItem.locator('[data-testid^="todo-status-display-"]')).toContainText('TODO');
  });

  test('should edit an existing todo', async ({ page }) => {
    // First create a todo
    await page.goto('/');
    await page.click('[data-testid="add-todo-button"]');
    await page.fill('[data-testid="todo-title-input"]', 'Original Title');
    await page.fill('[data-testid="todo-description-input"]', 'Original Description');
    await page.click('[data-testid="todo-submit-button"]');
    
    // Wait for the todo to appear
    const todoItem = page.locator('[data-testid^="todo-item-"]').first();
    await expect(todoItem).toBeVisible();
    
    // Click the edit button
    const editButton = todoItem.locator('[data-testid^="todo-edit-"]');
    await editButton.click();
    
    // Update the title and description
    const titleInput = todoItem.locator('[data-testid^="todo-edit-title-"]');
    await titleInput.clear();
    await titleInput.fill('Updated Title');
    
    const descriptionInput = todoItem.locator('[data-testid^="todo-edit-description-"]');
    await descriptionInput.clear();
    await descriptionInput.fill('Updated Description');
    
    // Change priority
    await todoItem.locator('[data-testid^="todo-edit-priority-"]').selectOption('LOW');
    
    // Save the changes
    await todoItem.locator('[data-testid^="todo-save-"]').click();
    
    // Verify the updates
    await expect(todoItem.locator('[data-testid^="todo-title-"]')).toContainText('Updated Title');
    await expect(todoItem.locator('[data-testid^="todo-description-"]')).toContainText('Updated Description');
    await expect(todoItem.locator('[data-testid^="todo-priority-"]')).toContainText('LOW');
  });

  test('should toggle todo status', async ({ page }) => {
    // Create a todo
    await page.goto('/');
    await page.click('[data-testid="add-todo-button"]');
    await page.fill('[data-testid="todo-title-input"]', 'Status Test Todo');
    await page.click('[data-testid="todo-submit-button"]');
    
    // Wait for the todo to appear
    const todoItem = page.locator('[data-testid^="todo-item-"]').first();
    await expect(todoItem).toBeVisible();
    
    // Verify initial status is TODO
    const statusElement = todoItem.locator('[data-testid^="todo-status-display-"]');
    await expect(statusElement).toContainText('TODO');
    
    // Toggle status to IN_PROGRESS
    await todoItem.locator('[data-testid^="todo-status-toggle-"]').click();
    await expect(statusElement).toContainText('IN PROGRESS');
    
    // Toggle status to DONE
    await todoItem.locator('[data-testid^="todo-status-toggle-"]').click();
    await expect(statusElement).toContainText('DONE');
    
    // Toggle back to TODO
    await todoItem.locator('[data-testid^="todo-status-toggle-"]').click();
    await expect(statusElement).toContainText('TODO');
  });

  test('should delete a todo', async ({ page }) => {
    // Create a todo
    await page.goto('/');
    await page.click('[data-testid="add-todo-button"]');
    await page.fill('[data-testid="todo-title-input"]', 'Todo to Delete');
    await page.click('[data-testid="todo-submit-button"]');
    
    // Wait for the todo to appear
    const todoItem = page.locator('[data-testid^="todo-item-"]').first();
    await expect(todoItem).toBeVisible();
    
    // Click the delete button
    await todoItem.locator('[data-testid^="todo-delete-"]').click();
    
    // Verify the todo is removed
    await expect(todoItem).not.toBeVisible();
    
    // Verify the empty state is shown if no todos remain
    const todoList = page.locator('[data-testid="todo-list"]');
    const emptyMessage = todoList.locator('text=No todos found');
    const todosCount = await page.locator('[data-testid^="todo-item-"]').count();
    
    if (todosCount === 0) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('should handle form validation', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="add-todo-button"]');
    
    // Try to submit without a title
    await page.click('[data-testid="todo-submit-button"]');
    
    // Verify error message is shown
    await expect(page.locator('text=Title is required')).toBeVisible();
    
    // Fill in the title and submit should work
    await page.fill('[data-testid="todo-title-input"]', 'Valid Title');
    await page.click('[data-testid="todo-submit-button"]');
    
    // Verify the todo is created
    const todoItem = page.locator('[data-testid^="todo-item-"]').first();
    await expect(todoItem).toBeVisible();
  });

  test('should cancel adding a todo', async ({ page }) => {
    await page.goto('/');
    
    // Open the form
    await page.click('[data-testid="add-todo-button"]');
    
    // Fill some data
    await page.fill('[data-testid="todo-title-input"]', 'Cancelled Todo');
    
    // Click cancel
    await page.click('[data-testid="todo-cancel-button"]');
    
    // Verify the form is closed
    await expect(page.locator('[data-testid="todo-title-input"]')).not.toBeVisible();
    
    // Verify no todo was created
    await expect(page.locator('text=Cancelled Todo')).not.toBeVisible();
  });

  test('should set due date for a todo', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="add-todo-button"]');
    
    // Fill in the form with a due date
    await page.fill('[data-testid="todo-title-input"]', 'Todo with Due Date');
    
    // Set a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + DAYS_IN_FUTURE);
    const dateString = futureDate.toISOString().split('T')[0];
    
    await page.fill('[data-testid="todo-due-date-input"]', dateString);
    await page.click('[data-testid="todo-submit-button"]');
    
    // Verify the todo shows the due date
    const todoItem = page.locator('[data-testid^="todo-item-"]').first();
    await expect(todoItem).toBeVisible();
    await expect(todoItem.locator('text=Due:')).toBeVisible();
  });
});