import { test, expect } from './fixtures/base-test';

test.describe('Global Search', () => {
  test('should navigate to search page via search icon', async ({ authenticatedPage: page }) => {
    // Click the search icon in the header
    await page.locator('button[aria-label="Search"]').click();
    
    // Verify we're on the search page
    await expect(page.locator('h1:has-text("Search")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('should navigate to search page via tab', async ({ authenticatedPage: page }) => {
    // Click the Search tab
    await page.locator('button:has-text("Search")').click();
    
    // Verify we're on the search page
    await expect(page.locator('h1:has-text("Search")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('should perform a search and display results', async ({ authenticatedPage: page }) => {
    // Navigate to search page
    await page.locator('button:has-text("Search")').click();
    
    // Create some test data first
    await page.locator('button:has-text("Todos")').click();
    await page.locator('button:has-text("Add Todo")').click();
    await page.fill('input[name="title"]', 'Search Test Todo');
    await page.fill('textarea[name="description"]', 'This is a test todo for search functionality');
    await page.locator('button[type="submit"]:has-text("Create")').click();
    await expect(page.locator('text=Search Test Todo')).toBeVisible();
    
    // Go back to search
    await page.locator('button:has-text("Search")').click();
    
    // Perform search
    await page.fill('input[placeholder*="Search"]', 'Search Test');
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Verify results
    await expect(page.locator('text=Found 1 result for "Search Test"')).toBeVisible();
    await expect(page.locator('text=Search Test Todo')).toBeVisible();
    await expect(page.locator('text=This is a test todo for search functionality')).toBeVisible();
  });

  test('should filter search results by type', async ({ authenticatedPage: page }) => {
    // Create test data in different types
    await page.locator('button:has-text("Todos")').click();
    await page.locator('button:has-text("Add Todo")').click();
    await page.fill('input[name="title"]', 'Filter Test Todo');
    await page.locator('button[type="submit"]:has-text("Create")').click();
    
    await page.locator('button:has-text("Notes")').click();
    await page.locator('button:has-text("Create Note")').click();
    await page.fill('input[name="title"]', 'Filter Test Note');
    await page.fill('textarea[name="content"]', 'Test note content');
    await page.locator('button[type="submit"]:has-text("Create")').click();
    
    // Go to search
    await page.locator('button:has-text("Search")').click();
    
    // Search for "Filter Test"
    await page.fill('input[placeholder*="Search"]', 'Filter Test');
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Should see both results
    await expect(page.locator('text=Filter Test Todo')).toBeVisible();
    await expect(page.locator('text=Filter Test Note')).toBeVisible();
    
    // Filter by Todos only
    await page.locator('label:has-text("Todos")').click();
    
    // Should only see todo result
    await expect(page.locator('text=Filter Test Todo')).toBeVisible();
    await expect(page.locator('text=Filter Test Note')).not.toBeVisible();
    
    // Uncheck Todos and check Notes
    await page.locator('label:has-text("Todos")').click();
    await page.locator('label:has-text("Notes")').click();
    
    // Should only see note result
    await expect(page.locator('text=Filter Test Todo')).not.toBeVisible();
    await expect(page.locator('text=Filter Test Note')).toBeVisible();
  });

  test('should clear search and show empty state', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("Search")').click();
    
    // Perform a search
    await page.fill('input[placeholder*="Search"]', 'nonexistent search term');
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Should show no results
    await expect(page.locator('text=No results found for "nonexistent search term"')).toBeVisible();
    
    // Clear search
    await page.locator('button[aria-label="Clear search"]').click();
    
    // Search input should be empty
    await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('');
  });

  test('should navigate to item when clicking search result', async ({ authenticatedPage: page }) => {
    // Create a todo
    await page.locator('button:has-text("Todos")').click();
    await page.locator('button:has-text("Add Todo")').click();
    await page.fill('input[name="title"]', 'Navigate Test Todo');
    await page.fill('textarea[name="description"]', 'Click this to navigate');
    await page.locator('button[type="submit"]:has-text("Create")').click();
    
    // Search for it
    await page.locator('button:has-text("Search")').click();
    await page.fill('input[placeholder*="Search"]', 'Navigate Test');
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Click the result
    await page.locator('text=Navigate Test Todo').click();
    
    // Should navigate to the todos page with the item visible
    await expect(page.locator('button.text-primary:has-text("Todos")')).toBeVisible();
    await expect(page.locator('text=Navigate Test Todo')).toBeVisible();
  });

  test('should show correct type badges in results', async ({ authenticatedPage: page }) => {
    // Create items of different types
    await page.locator('button:has-text("Todos")').click();
    await page.locator('button:has-text("Add Todo")').click();
    await page.fill('input[name="title"]', 'Badge Test Item');
    await page.locator('button[type="submit"]:has-text("Create")').click();
    
    await page.locator('button:has-text("Goals")').click();
    await page.locator('button:has-text("Add Goal")').click();
    await page.fill('input[name="title"]', 'Badge Test Item');
    await page.selectOption('select[name="type"]', 'MONTHLY');
    await page.locator('button[type="submit"]:has-text("Create")').click();
    
    // Search
    await page.locator('button:has-text("Search")').click();
    await page.fill('input[placeholder*="Search"]', 'Badge Test');
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Verify type badges
    await expect(page.locator('text=Todo').first()).toBeVisible();
    await expect(page.locator('text=Goal').first()).toBeVisible();
  });

  test('should handle search with special characters', async ({ authenticatedPage: page }) => {
    // Create a todo with special characters
    await page.locator('button:has-text("Todos")').click();
    await page.locator('button:has-text("Add Todo")').click();
    await page.fill('input[name="title"]', 'Test & Special % Characters');
    await page.locator('button[type="submit"]:has-text("Create")').click();
    
    // Search
    await page.locator('button:has-text("Search")').click();
    await page.fill('input[placeholder*="Search"]', 'Test & Special');
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Should find the result
    await expect(page.locator('text=Test & Special % Characters')).toBeVisible();
  });

  test('should show search results with metadata', async ({ authenticatedPage: page }) => {
    // Create a high priority todo
    await page.locator('button:has-text("Todos")').click();
    await page.locator('button:has-text("Add Todo")').click();
    await page.fill('input[name="title"]', 'Metadata Test Todo');
    await page.selectOption('select[name="priority"]', 'HIGH');
    await page.locator('button[type="submit"]:has-text("Create")').click();
    
    // Search for it
    await page.locator('button:has-text("Search")').click();
    await page.fill('input[placeholder*="Search"]', 'Metadata Test');
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Should show priority in results
    await expect(page.locator('text=high')).toBeVisible();
  });
});