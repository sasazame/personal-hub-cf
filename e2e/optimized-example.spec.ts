import { test, expect, TestDataHelper, PerformanceMonitor } from './helpers/test-optimization';

/**
 * Example of optimized E2E tests using performance helpers
 * This demonstrates best practices for fast E2E test execution
 */

test.describe('Optimized Todo Tests', () => {
  test.describe.configure({ mode: 'parallel' });

  test('should quickly create and manage todos', async ({ authenticatedPage, apiContext }) => {
    const perf = new PerformanceMonitor();
    const dataHelper = new TestDataHelper(apiContext);
    
    perf.mark('test-start');
    
    // Create test data via API (much faster than UI)
    perf.mark('api-setup-start');
    await dataHelper.createMultipleTodos('test-user', 5);
    perf.measure('API Setup', 'api-setup-start');
    
    // Navigate to todos page
    perf.mark('navigation-start');
    await authenticatedPage.goto('/todos');
    await authenticatedPage.waitForSelector('h1:has-text("TODOs")', { timeout: 5000 });
    perf.measure('Navigation', 'navigation-start');
    
    // Verify todos appear (they were created via API)
    perf.mark('verification-start');
    await expect(authenticatedPage.locator('.todo-item')).toHaveCount(5, { timeout: 5000 });
    perf.measure('Verification', 'verification-start');
    
    perf.measure('Total Test Time', 'test-start');
  });

  test('should handle multiple operations in parallel', async ({ authenticatedPage, apiContext }) => {
    const dataHelper = new TestDataHelper(apiContext);
    
    // Perform multiple operations in parallel for speed
    await Promise.all([
      dataHelper.createMultipleTodos('test-user', 3),
      dataHelper.createMultipleNotes('test-user', 3),
      authenticatedPage.goto('/dashboard'),
    ]);
    
    // Verify dashboard loaded
    await expect(authenticatedPage).toHaveURL(/.*dashboard/);
    
    // Navigate to todos and verify count
    await authenticatedPage.click('a:has-text("TODOs")');
    await expect(authenticatedPage.locator('.todo-item')).toHaveCount(3, { timeout: 5000 });
    
    // Navigate to notes and verify count
    await authenticatedPage.click('a:has-text("Notes")');
    await expect(authenticatedPage.locator('.note-card')).toHaveCount(3, { timeout: 5000 });
  });

  test('should use smart waiting strategies', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/todos');
    
    // Wait for network idle instead of fixed timeouts
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Use web-first assertions that auto-wait
    const addButton = authenticatedPage.getByRole('button', { name: 'Add Todo' });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
    
    // Click and wait for response in parallel
    const [response] = await Promise.all([
      authenticatedPage.waitForResponse(resp => resp.url().includes('/api/v1/todos') && resp.ok()),
      addButton.click(),
    ]);
    
    // Verify response was successful
    expect(response.status()).toBe(201);
  });
});

test.describe('Batch Operations', () => {
  test('should efficiently test bulk operations', async ({ authenticatedPage, apiContext }) => {
    const perf = new PerformanceMonitor();
    
    // Measure bulk creation performance
    await perf.measureAsync('Bulk Create 10 Todos', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          apiContext.post('/api/v1/todos', {
            data: {
              title: `Bulk Todo ${i}`,
              description: `Description ${i}`,
              priority: 'MEDIUM',
            },
          })
        );
      }
      await Promise.all(promises);
    });
    
    // Verify UI updates efficiently
    await authenticatedPage.goto('/todos');
    await expect(authenticatedPage.locator('.todo-item')).toHaveCount(10, { timeout: 10000 });
  });
});

test.describe('Smart Retries', () => {
  test('should handle flaky operations gracefully', async ({ authenticatedPage }) => {
    // Use Playwright's built-in retry mechanisms
    await authenticatedPage.goto('/notes');
    
    // This will automatically retry if the element is not immediately available
    const newNoteButton = authenticatedPage.getByRole('button', { name: 'New Note' });
    
    // Use toPass for custom retry logic
    await expect(async () => {
      await newNoteButton.click();
      const modal = authenticatedPage.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
    }).toPass({
      intervals: [1000, 2000, 3000],
      timeout: 10000,
    });
  });
});