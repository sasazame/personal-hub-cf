import { test, expect } from '@playwright/test';

test.describe('Pomodoro Feature E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
    const timestamp = Date.now().toString().slice(-6);
    const username = `testpomo${timestamp}`;
    const email = `test${timestamp}@example.com`;
    const password = 'Test123456!';

    // Navigate to register page
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
  });

  test('should navigate to Pomodoro from dashboard', async ({ page }) => {
    // Click on Pomodoro card
    await page.click('[href="/pomodoro"]');
    
    // Verify we're on the Pomodoro page
    await expect(page).toHaveURL('/pomodoro');
    await expect(page.locator('main h1').first()).toContainText('ポモドーロタイマー');
  });

  test('should create and start a Pomodoro session', async ({ page }) => {
    // Navigate to Pomodoro
    await page.goto('/pomodoro');
    
    // Click create session button
    await page.getByRole('button', { name: 'セッションを開始' }).click();
    
    // Wait for timer to appear
    await expect(page.locator('[data-testid="pomodoro-timer"]')).toBeVisible();
    
    // Verify timer shows 25:00
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('25:00');
    
    // Verify session type is WORK
    await expect(page.locator('[data-testid="session-type"]')).toContainText('作業');
  });

  test('should add tasks to session', async ({ page }) => {
    // Navigate to Pomodoro and start session
    await page.goto('/pomodoro');
    await page.getByRole('button', { name: 'セッションを開始' }).click();
    
    // Add a task
    await page.fill('input[placeholder="タスクを追加..."]', 'Test task 1');
    await page.press('input[placeholder="タスクを追加..."]', 'Enter');
    
    // Verify task appears in list
    await expect(page.locator('text=Test task 1')).toBeVisible();
    
    // Add another task
    await page.fill('input[placeholder="タスクを追加..."]', 'Test task 2');
    await page.press('input[placeholder="タスクを追加..."]', 'Enter');
    
    // Verify both tasks are visible
    await expect(page.locator('text=Test task 1')).toBeVisible();
    await expect(page.locator('text=Test task 2')).toBeVisible();
  });

  test('should complete tasks', async ({ page }) => {
    // Navigate to Pomodoro and start session
    await page.goto('/pomodoro');
    await page.getByRole('button', { name: 'セッションを開始' }).click();
    
    // Add a task
    await page.fill('input[placeholder="タスクを追加..."]', 'Task to complete');
    await page.press('input[placeholder="タスクを追加..."]', 'Enter');
    
    // Click checkbox to complete task
    await page.click('input[type="checkbox"]');
    
    // Verify task is marked as completed
    await expect(page.locator('text=Task to complete')).toHaveClass(/line-through/);
  });

  test('should handle timer controls', async ({ page }) => {
    // Navigate to Pomodoro and start session
    await page.goto('/pomodoro');
    await page.getByRole('button', { name: 'セッションを開始' }).click();
    
    // Start timer
    await page.getByRole('button', { name: '開始' }).click();
    
    // Wait a moment
    await page.waitForTimeout(2000);
    
    // Pause timer
    await page.getByRole('button', { name: '一時停止' }).click();
    
    // Verify pause button changed to resume
    await expect(page.getByRole('button', { name: '再開' })).toBeVisible();
    
    // Stop timer
    await page.getByRole('button', { name: '停止' }).click();
    
    // Verify session ended
    await expect(page.getByRole('button', { name: 'セッションを開始' })).toBeVisible();
  });

  test('should show session history', async ({ page }) => {
    // Navigate to Pomodoro and create a session
    await page.goto('/pomodoro');
    await page.getByRole('button', { name: 'セッションを開始' }).click();
    
    // Complete the session immediately
    await page.getByRole('button', { name: 'スキップ' }).click();
    
    // Verify session appears in history
    await expect(page.locator('[data-testid="session-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-history"] >> text=作業')).toBeVisible();
    await expect(page.locator('[data-testid="session-history"] >> text=完了')).toBeVisible();
  });

  test('should update configuration', async ({ page }) => {
    // Navigate to Pomodoro
    await page.goto('/pomodoro');
    
    // Open settings
    await page.click('[data-testid="settings-button"]');
    
    // Update work duration
    await page.fill('input[name="workDuration"]', '30');
    
    // Update break duration
    await page.fill('input[name="shortBreakDuration"]', '10');
    
    // Save settings
    await page.getByRole('button', { name: '保存' }).click();
    
    // Verify settings were saved (would need to create new session to verify)
    await expect(page.locator('[data-testid="settings-saved-message"]')).toBeVisible();
  });

  test('should integrate with todo list', async ({ page }) => {
    // First create a todo
    await page.goto('/todos');
    await page.fill('input[placeholder="新しいタスクを入力..."]', 'Todo for Pomodoro');
    await page.press('input[placeholder="新しいタスクを入力..."]', 'Enter');
    
    // Navigate to Pomodoro
    await page.goto('/pomodoro');
    await page.getByRole('button', { name: 'セッションを開始' }).click();
    
    // Link todo to Pomodoro
    await page.click('[data-testid="link-todo-button"]');
    await page.click('text=Todo for Pomodoro');
    
    // Verify todo is linked
    await expect(page.locator('[data-testid="linked-todos"] >> text=Todo for Pomodoro')).toBeVisible();
  });

  test('should display proper error messages', async ({ page }) => {
    // Navigate to Pomodoro
    await page.goto('/pomodoro');
    
    // Try to add empty task (if session is active)
    await page.getByRole('button', { name: 'セッションを開始' }).click();
    await page.fill('input[placeholder="タスクを追加..."]', '');
    await page.press('input[placeholder="タスクを追加..."]', 'Enter');
    
    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should handle multiple sessions correctly', async ({ page }) => {
    // Create first session
    await page.goto('/pomodoro');
    await page.getByRole('button', { name: 'セッションを開始' }).click();
    await page.getByRole('button', { name: 'スキップ' }).click();
    
    // Create second session
    await page.getByRole('button', { name: 'セッションを開始' }).click();
    
    // Verify new session is active
    await expect(page.locator('[data-testid="pomodoro-timer"]')).toBeVisible();
    
    // Check history shows previous session
    await expect(page.locator('[data-testid="session-history"] [data-testid="session-item"]')).toHaveCount(1);
  });

  test.describe('Full POMODORO Cycle Tests', () => {
    test('should complete full work-break cycle with shortened timers', async ({ page }) => {
      // Navigate to Pomodoro
      await page.goto('/pomodoro');
      
      // Open settings and configure short durations for testing
      await page.click('[data-testid="settings-button"]');
      
      // Set work duration to 1 minute
      await page.fill('input[name="workDuration"]', '1');
      
      // Set short break to 1 minute  
      await page.fill('input[name="shortBreakDuration"]', '1');
      
      // Enable auto-start breaks
      const autoStartBreaksSwitch = page.locator('#autoStartBreaks');
      if (!(await autoStartBreaksSwitch.isChecked())) {
        await autoStartBreaksSwitch.click();
      }
      
      // Save settings
      await page.getByRole('button', { name: '保存' }).click();
      await page.waitForTimeout(1000); // Wait for save to complete
      
      // Start work session
      await page.getByRole('button', { name: 'セッションを開始' }).click();
      
      // Verify work session is created
      await expect(page.locator('[data-testid="session-type"]')).toContainText('作業');
      await expect(page.locator('[data-testid="timer-display"]')).toContainText('1:00');
      
      // Start the timer
      await page.getByRole('button', { name: '開始' }).click();
      
      // Add a task to track
      await page.fill('input[placeholder="タスクを追加..."]', 'Test task for cycle');
      await page.press('input[placeholder="タスクを追加..."]', 'Enter');
      
      // Wait for work session to complete - use a more reasonable wait strategy
      // Since we set the timer to 1 minute, we'll wait for the session type to change to break
      await expect(page.locator('[data-testid="session-type"]')).toContainText('休憩', { timeout: 70000 });
      
      // Verify break session auto-started
      await expect(page.locator('[data-testid="session-type"]')).toContainText('休憩');
      await expect(page.locator('[data-testid="timer-display"]')).toContainText(/\d+:\d+/);
      
      // Complete break session immediately
      await page.getByRole('button', { name: 'スキップ' }).click();
      
      // Verify we can start a new work session
      await expect(page.getByRole('button', { name: 'セッションを開始' })).toBeVisible();
      
      // Check history shows both sessions
      await expect(page.locator('[data-testid="session-history"] [data-testid="session-item"]')).toHaveCount(2);
    });

    test('should handle session state recovery', async ({ page }) => {
      // Navigate to Pomodoro and start session
      await page.goto('/pomodoro');
      await page.getByRole('button', { name: 'セッションを開始' }).click();
      await page.getByRole('button', { name: '開始' }).click();
      
      // Navigate away and come back
      await page.goto('/dashboard');
      await page.goto('/pomodoro');
      
      // Verify session is still active
      await expect(page.locator('[data-testid="pomodoro-timer"]')).toBeVisible();
      await expect(page.locator('[data-testid="timer-display"]')).toContainText(/\d+:\d+/);
    });

    test('should persist settings across sessions', async ({ page }) => {
      // Navigate to Pomodoro
      await page.goto('/pomodoro');
      
      // Open settings and configure
      await page.click('[data-testid="settings-button"]');
      
      // Set cycles before long break to 3
      await page.fill('input[name="cyclesBeforeLongBreak"]', '3');
      
      // Save settings
      await page.getByRole('button', { name: '保存' }).click();
      await page.waitForTimeout(1000);
      
      // Reload page
      await page.reload();
      
      // Open settings again
      await page.click('[data-testid="settings-button"]');
      
      // Verify setting was persisted
      await expect(page.locator('input[value="3"]')).toBeVisible();
    });

    test('should handle pause state correctly across navigation', async ({ page }) => {
      // Navigate to Pomodoro and start session
      await page.goto('/pomodoro');
      await page.getByRole('button', { name: 'セッションを開始' }).click();
      await page.getByRole('button', { name: '開始' }).click();
      
      // Wait a moment then pause
      await page.waitForTimeout(3000);
      await page.getByRole('button', { name: '一時停止' }).click();
      
      // Navigate away and come back
      await page.goto('/dashboard');
      await page.goto('/pomodoro');
      
      // Verify session is still paused
      await expect(page.getByRole('button', { name: '再開' })).toBeVisible();
      
      // Resume and verify it works
      await page.getByRole('button', { name: '再開' }).click();
      await expect(page.getByRole('button', { name: '一時停止' })).toBeVisible();
    });
  });
});