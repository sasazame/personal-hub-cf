import { test, expect } from './fixtures/base-test';
import { login } from './helpers/auth';

test.describe('Todo Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    
    // Create 25 todos to test pagination (default limit is 20)
    for (let i = 1; i <= 25; i++) {
      await page.click('[data-testid="add-todo-button"]');
      await page.fill('[data-testid="todo-title-input"]', `Todo Item ${i.toString().padStart(2, '0')}`);
      await page.click('[data-testid="todo-submit-button"]');
      
      // Wait for the form to close
      await page.waitForSelector('[data-testid="todo-title-input"]', { state: 'hidden' });
    }
  });

  test('should show pagination controls when more than 20 todos', async ({ page }) => {
    await page.goto('/');
    
    // Wait for todos to load
    await page.waitForSelector('[data-testid^="todo-item-"]');
    
    // Verify pagination controls are visible
    await expect(page.locator('[data-testid="todo-prev-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="todo-next-page"]')).toBeVisible();
    
    // Verify page info shows page 1
    await expect(page.locator('text=Page 1 of 2')).toBeVisible();
    
    // Verify only 20 items are shown on first page
    const todoItems = page.locator('[data-testid^="todo-item-"]');
    const count = await todoItems.count();
    expect(count).toBe(20);
  });

  test('should navigate to next and previous pages', async ({ page }) => {
    await page.goto('/');
    
    // Wait for todos to load
    await page.waitForSelector('[data-testid^="todo-item-"]');
    
    // Click next page
    await page.click('[data-testid="todo-next-page"]');
    
    // Verify page info updated
    await expect(page.locator('text=Page 2 of 2')).toBeVisible();
    
    // Verify 5 items on second page (25 total - 20 on first page)
    const todoItems = page.locator('[data-testid^="todo-item-"]');
    const secondPageCount = await todoItems.count();
    expect(secondPageCount).toBe(5);
    
    // Verify the items are different (should show Todo 05 to Todo 01 on page 2 due to desc sort)
    const firstItemOnPage2 = todoItems.first();
    await expect(firstItemOnPage2.locator('[data-testid^="todo-title-"]')).toContainText('Todo Item 05');
    
    // Click previous page
    await page.click('[data-testid="todo-prev-page"]');
    
    // Verify back on page 1
    await expect(page.locator('text=Page 1 of 2')).toBeVisible();
    const firstPageCount = await todoItems.count();
    expect(firstPageCount).toBe(20);
  });

  test('should disable navigation buttons appropriately', async ({ page }) => {
    await page.goto('/');
    
    // Wait for todos to load
    await page.waitForSelector('[data-testid^="todo-item-"]');
    
    // On page 1, previous button should be disabled
    const prevButton = page.locator('[data-testid="todo-prev-page"]');
    const nextButton = page.locator('[data-testid="todo-next-page"]');
    
    await expect(prevButton).toBeDisabled();
    await expect(nextButton).not.toBeDisabled();
    
    // Navigate to page 2
    await nextButton.click();
    
    // On page 2, next button should be disabled
    await expect(prevButton).not.toBeDisabled();
    await expect(nextButton).toBeDisabled();
  });

  test('should maintain pagination state with filters', async ({ page }) => {
    await page.goto('/');
    
    // Create additional high priority todos to ensure pagination with filter
    for (let i = 26; i <= 35; i++) {
      await page.click('[data-testid="add-todo-button"]');
      await page.fill('[data-testid="todo-title-input"]', `High Priority Todo ${i}`);
      await page.selectOption('[data-testid="todo-priority-select"]', 'HIGH');
      await page.click('[data-testid="todo-submit-button"]');
      await page.waitForSelector('[data-testid="todo-title-input"]', { state: 'hidden' });
    }
    
    // Apply HIGH priority filter
    await page.selectOption('[data-testid="todo-priority-filter"]', 'HIGH');
    await page.waitForTimeout(500);
    
    // Verify pagination still works with filter
    const todoItems = page.locator('[data-testid^="todo-item-"]');
    const highPriorityCount = await todoItems.count();
    
    // Should show filtered results (less than 20 if not all are HIGH priority)
    expect(highPriorityCount).toBeLessThanOrEqual(20);
    
    // All visible items should be HIGH priority
    for (let i = 0; i < highPriorityCount; i++) {
      const priority = todoItems.nth(i).locator('[data-testid^="todo-priority-"]');
      await expect(priority).toContainText('HIGH');
    }
  });

  test('should reset to page 1 when applying filters', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to page 2
    await page.click('[data-testid="todo-next-page"]');
    await expect(page.locator('text=Page 2 of 2')).toBeVisible();
    
    // Apply a filter
    await page.selectOption('[data-testid="todo-status-filter"]', 'TODO');
    await page.waitForTimeout(500);
    
    // Should be back on page 1
    await expect(page.locator('text=Page 1 of')).toBeVisible();
  });

  test('should handle single page of results', async ({ page }) => {
    // Clear existing todos and create just 10
    await page.goto('/');
    
    // Apply a filter that results in fewer than 20 items
    await page.selectOption('[data-testid="todo-priority-filter"]', 'MEDIUM');
    await page.waitForTimeout(500);
    
    const todoItems = page.locator('[data-testid^="todo-item-"]');
    const count = await todoItems.count();
    
    // If there are any medium priority todos but less than 20
    if (count > 0 && count <= 20) {
      // Pagination controls should not be visible
      await expect(page.locator('[data-testid="todo-prev-page"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="todo-next-page"]')).not.toBeVisible();
      await expect(page.locator('text=Page')).not.toBeVisible();
    }
  });
});