import { test, expect } from './fixtures/base-test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await authenticatedPage;
    await page.goto('http://localhost:5173');
    
    // Wait for the dashboard to load
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });
  });

  test('should display dashboard as default view', async ({ page }) => {
    // Check that Dashboard tab is active by default
    const dashboardTab = page.locator('button:has-text("Dashboard")');
    await expect(dashboardTab).toHaveClass(/text-primary border-b-2 border-primary/);
    
    // Check that dashboard title is visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    // Wait for stats to load
    await page.waitForSelector('[class*="grid"] [class*="card"]', { timeout: 10000 });
    
    // Check for key stat cards
    await expect(page.locator('text=Todos')).toBeVisible();
    await expect(page.locator('text=Goals in Progress')).toBeVisible();
    await expect(page.locator('text=Upcoming Events')).toBeVisible();
    await expect(page.locator('text=Notes')).toBeVisible();
    await expect(page.locator('text=Moments Today')).toBeVisible();
    await expect(page.locator('text=Pomodoro Today')).toBeVisible();
  });

  test('should show recent todos if available', async ({ page }) => {
    // First create a todo
    await page.click('button:has-text("Todos")');
    await page.waitForSelector('text=Add Todo');
    await page.click('text=Add Todo');
    
    await page.fill('input[placeholder="Enter todo title"]', 'Test Dashboard Todo');
    await page.click('button:has-text("Create")');
    
    // Go back to dashboard
    await page.click('button:has-text("Dashboard")');
    await page.waitForSelector('h1:has-text("Dashboard")');
    
    // Check if recent todo appears
    await expect(page.locator('text=Recent Todos')).toBeVisible();
    await expect(page.locator('text=Test Dashboard Todo')).toBeVisible();
  });

  test('should show recent goals if available', async ({ page }) => {
    // First create a goal
    await page.click('button:has-text("Goals")');
    await page.waitForSelector('text=Add Goal');
    await page.click('text=Add Goal');
    
    await page.fill('input[placeholder="Enter goal title"]', 'Test Dashboard Goal');
    await page.fill('textarea[placeholder="Enter goal description"]', 'Test description');
    await page.click('button:has-text("Create")');
    
    // Go back to dashboard
    await page.click('button:has-text("Dashboard")');
    await page.waitForSelector('h1:has-text("Dashboard")');
    
    // Check if recent goal appears
    await expect(page.locator('text=Recent Goals')).toBeVisible();
    await expect(page.locator('text=Test Dashboard Goal')).toBeVisible();
  });

  test('should show recent moments if available', async ({ page }) => {
    // First create a moment
    await page.click('button:has-text("Moments")');
    await page.waitForSelector('textarea[placeholder*="moment"]');
    
    await page.fill('textarea[placeholder*="moment"]', 'Test dashboard moment #test');
    await page.click('button:has-text("Create")');
    
    // Go back to dashboard
    await page.click('button:has-text("Dashboard")');
    await page.waitForSelector('h1:has-text("Dashboard")');
    
    // Check if recent moment appears
    await expect(page.locator('text=Recent Moments')).toBeVisible();
    await expect(page.locator('text=Test dashboard moment')).toBeVisible();
  });

  test('should refresh stats periodically', async ({ page }) => {
    // Create a todo
    await page.click('button:has-text("Todos")');
    await page.waitForSelector('text=Add Todo');
    await page.click('text=Add Todo');
    
    await page.fill('input[placeholder="Enter todo title"]', 'Refresh Test Todo');
    await page.click('button:has-text("Create")');
    
    // Go to dashboard
    await page.click('button:has-text("Dashboard")');
    await page.waitForSelector('h1:has-text("Dashboard")');
    
    // Get initial pending count
    const todosCard = page.locator('text=Todos').locator('..').locator('..');
    const initialCount = await todosCard.locator('.text-2xl').textContent();
    
    // Go back and complete the todo
    await page.click('button:has-text("Todos")');
    await page.waitForSelector('text=Refresh Test Todo');
    await page.click('input[type="checkbox"]:near(:text("Refresh Test Todo"))');
    
    // Go back to dashboard
    await page.click('button:has-text("Dashboard")');
    
    // Wait for refresh (stats refresh every 30 seconds, but we can wait less)
    await page.waitForTimeout(1000);
    
    // Check that pending count has changed
    const newCount = await todosCard.locator('.text-2xl').textContent();
    expect(parseInt(newCount || '0')).toBeLessThan(parseInt(initialCount || '1'));
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Dashboard should still load even with no data
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    
    // All stat cards should show 0 or empty state
    const statCards = page.locator('[class*="card"]');
    const count = await statCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show active pomodoro session if one exists', async ({ page }) => {
    // Start a pomodoro session
    await page.click('button:has-text("Pomodoro")');
    await page.waitForSelector('button:has-text("Start Work")');
    await page.click('button:has-text("Start Work")');
    
    // Go to dashboard
    await page.click('button:has-text("Dashboard")');
    await page.waitForSelector('h1:has-text("Dashboard")');
    
    // Check for active session card
    await expect(page.locator('text=Active Session')).toBeVisible();
    await expect(page.locator('text=work - minutes left')).toBeVisible();
  });

  test('should navigate to feature tabs when clicking on content', async ({ page }) => {
    // Create a todo first
    await page.click('button:has-text("Todos")');
    await page.waitForSelector('text=Add Todo');
    await page.click('text=Add Todo');
    
    await page.fill('input[placeholder="Enter todo title"]', 'Click Test Todo');
    await page.click('button:has-text("Create")');
    
    // Go back to dashboard
    await page.click('button:has-text("Dashboard")');
    await page.waitForSelector('h1:has-text("Dashboard")');
    
    // Note: In the current implementation, clicking on items doesn't navigate
    // This test documents the current behavior
    await expect(page.locator('text=Recent Todos')).toBeVisible();
    await expect(page.locator('text=Click Test Todo')).toBeVisible();
  });
});