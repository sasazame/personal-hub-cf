import { test, expect } from './fixtures/base-test';
import { login } from './helpers/auth';

test.describe('Todo Filtering and Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    
    // Create multiple todos with different statuses and priorities
    const todos = [
      { title: 'High Priority Todo', priority: 'HIGH', status: 'TODO' },
      { title: 'Medium Priority In Progress', priority: 'MEDIUM', status: 'IN_PROGRESS' },
      { title: 'Low Priority Done', priority: 'LOW', status: 'DONE' },
      { title: 'Another High Priority', priority: 'HIGH', status: 'IN_PROGRESS' },
      { title: 'Another Low Priority', priority: 'LOW', status: 'TODO' },
    ];

    for (const todo of todos) {
      await page.click('[data-testid="add-todo-button"]');
      await page.fill('[data-testid="todo-title-input"]', todo.title);
      await page.selectOption('[data-testid="todo-priority-select"]', todo.priority);
      await page.click('[data-testid="todo-submit-button"]');
      
      // Wait for the form to close
      await page.waitForSelector('[data-testid="todo-title-input"]', { state: 'hidden' });
      
      // If status needs to be changed from TODO
      if (todo.status !== 'TODO') {
        const todoItem = page.locator(`[data-testid^="todo-item-"]`).filter({ hasText: todo.title });
        const toggleButton = todoItem.locator('[data-testid^="todo-status-toggle-"]');
        
        if (todo.status === 'IN_PROGRESS') {
          await toggleButton.click();
          await expect(todoItem.locator('[data-testid^="todo-status-"]')).toContainText('IN PROGRESS');
        } else if (todo.status === 'DONE') {
          await toggleButton.click(); // To IN_PROGRESS
          await toggleButton.click(); // To DONE
          await expect(todoItem.locator('[data-testid^="todo-status-"]')).toContainText('DONE');
        }
      }
    }
  });

  test('should filter todos by status', async ({ page }) => {
    await page.goto('/');
    
    // Filter by TODO status
    await page.selectOption('[data-testid="todo-status-filter"]', 'TODO');
    await page.waitForTimeout(500); // Wait for filter to apply
    
    // Verify only TODO items are visible
    const todoItems = page.locator('[data-testid^="todo-item-"]');
    const todoCount = await todoItems.count();
    expect(todoCount).toBe(2); // High Priority Todo and Another Low Priority
    
    // Verify all visible items have TODO status
    for (let i = 0; i < todoCount; i++) {
      const status = todoItems.nth(i).locator('[data-testid^="todo-status-"]');
      await expect(status).toContainText('TODO');
    }
    
    // Filter by IN_PROGRESS status
    await page.selectOption('[data-testid="todo-status-filter"]', 'IN_PROGRESS');
    await page.waitForTimeout(500);
    
    const inProgressCount = await todoItems.count();
    expect(inProgressCount).toBe(2); // Medium Priority In Progress and Another High Priority
    
    // Filter by DONE status
    await page.selectOption('[data-testid="todo-status-filter"]', 'DONE');
    await page.waitForTimeout(500);
    
    const doneCount = await todoItems.count();
    expect(doneCount).toBe(1); // Low Priority Done
    
    // Clear filter (show all)
    await page.selectOption('[data-testid="todo-status-filter"]', '');
    await page.waitForTimeout(500);
    
    const allCount = await todoItems.count();
    expect(allCount).toBe(5); // All todos should be visible
  });

  test('should filter todos by priority', async ({ page }) => {
    await page.goto('/');
    
    // Filter by HIGH priority
    await page.selectOption('[data-testid="todo-priority-filter"]', 'HIGH');
    await page.waitForTimeout(500);
    
    const todoItems = page.locator('[data-testid^="todo-item-"]');
    const highCount = await todoItems.count();
    expect(highCount).toBe(2); // High Priority Todo and Another High Priority
    
    // Verify all visible items have HIGH priority
    for (let i = 0; i < highCount; i++) {
      const priority = todoItems.nth(i).locator('[data-testid^="todo-priority-"]');
      await expect(priority).toContainText('HIGH');
    }
    
    // Filter by MEDIUM priority
    await page.selectOption('[data-testid="todo-priority-filter"]', 'MEDIUM');
    await page.waitForTimeout(500);
    
    const mediumCount = await todoItems.count();
    expect(mediumCount).toBe(1); // Medium Priority In Progress
    
    // Filter by LOW priority
    await page.selectOption('[data-testid="todo-priority-filter"]', 'LOW');
    await page.waitForTimeout(500);
    
    const lowCount = await todoItems.count();
    expect(lowCount).toBe(2); // Low Priority Done and Another Low Priority
  });

  test('should combine status and priority filters', async ({ page }) => {
    await page.goto('/');
    
    // Filter by HIGH priority and IN_PROGRESS status
    await page.selectOption('[data-testid="todo-priority-filter"]', 'HIGH');
    await page.selectOption('[data-testid="todo-status-filter"]', 'IN_PROGRESS');
    await page.waitForTimeout(500);
    
    const todoItems = page.locator('[data-testid^="todo-item-"]');
    const count = await todoItems.count();
    expect(count).toBe(1); // Another High Priority (HIGH + IN_PROGRESS)
    
    // Verify the item matches both filters
    const item = todoItems.first();
    await expect(item.locator('[data-testid^="todo-status-"]')).toContainText('IN PROGRESS');
    await expect(item.locator('[data-testid^="todo-priority-"]')).toContainText('HIGH');
    
    // Filter by LOW priority and TODO status
    await page.selectOption('[data-testid="todo-priority-filter"]', 'LOW');
    await page.selectOption('[data-testid="todo-status-filter"]', 'TODO');
    await page.waitForTimeout(500);
    
    const lowTodoCount = await todoItems.count();
    expect(lowTodoCount).toBe(1); // Another Low Priority (LOW + TODO)
  });

  test('should show empty state when no todos match filters', async ({ page }) => {
    await page.goto('/');
    
    // Filter by combination that doesn't exist
    await page.selectOption('[data-testid="todo-priority-filter"]', 'HIGH');
    await page.selectOption('[data-testid="todo-status-filter"]', 'DONE');
    await page.waitForTimeout(500);
    
    // Verify no todos are shown
    const todoItems = page.locator('[data-testid^="todo-item-"]');
    const count = await todoItems.count();
    expect(count).toBe(0);
    
    // Verify empty state message is shown
    await expect(page.locator('text=No todos found')).toBeVisible();
  });

  test('should persist filter state when toggling todo status', async ({ page }) => {
    await page.goto('/');
    
    // Filter by TODO status
    await page.selectOption('[data-testid="todo-status-filter"]', 'TODO');
    await page.waitForTimeout(500);
    
    // Get the first todo and toggle its status
    const firstTodo = page.locator('[data-testid^="todo-item-"]').first();
    const todoTitle = await firstTodo.locator('[data-testid^="todo-title-"]').textContent();
    await firstTodo.locator('[data-testid^="todo-status-toggle-"]').click();
    
    // The todo should disappear from the filtered view
    await expect(firstTodo).not.toBeVisible();
    
    // Switch to IN_PROGRESS filter
    await page.selectOption('[data-testid="todo-status-filter"]', 'IN_PROGRESS');
    await page.waitForTimeout(500);
    
    // The todo should now be visible in the IN_PROGRESS filter
    const inProgressTodo = page.locator('[data-testid^="todo-item-"]').filter({ hasText: todoTitle || '' });
    await expect(inProgressTodo).toBeVisible();
    await expect(inProgressTodo.locator('[data-testid^="todo-status-"]')).toContainText('IN PROGRESS');
  });
});