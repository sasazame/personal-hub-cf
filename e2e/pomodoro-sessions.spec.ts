import { test, expect } from './fixtures/base-test';
import { login } from './helpers/auth';

test.describe('Pomodoro Sessions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/');
    
    // Navigate to Pomodoro tab
    await page.getByRole('button', { name: 'Pomodoro' }).click();
    await expect(page.getByText('Pomodoro Timer')).toBeVisible();
  });

  test('should track work sessions correctly', async ({ page }) => {
    // Start a work session
    await page.getByRole('button', { name: 'Start' }).click();
    
    // Let it run for a bit
    await page.waitForTimeout(3000);
    
    // Pause to complete session
    await page.getByRole('button', { name: 'Pause' }).click();
    
    // Check that session appears in recent sessions
    const recentSessions = page.locator('text=Recent Sessions').locator('..');
    await expect(recentSessions.getByText('Work')).toBeVisible();
    await expect(recentSessions.getByText('less than a minute ago')).toBeVisible();
  });

  test('should track break sessions correctly', async ({ page }) => {
    // Switch to short break
    await page.getByRole('button', { name: 'Short Break' }).click();
    
    // Start break session
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Pause' }).click();
    
    // Check recent sessions
    const recentSessions = page.locator('text=Recent Sessions').locator('..');
    await expect(recentSessions.getByText('Short Break')).toBeVisible();
  });

  test('should update statistics after completing sessions', async ({ page }) => {
    // Get initial total sessions count
    const totalSessionsElement = page.locator('text=Total Sessions').locator('..').locator('.text-2xl');
    const initialCount = parseInt(await totalSessionsElement.textContent() || '0');
    
    // Complete a session
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Pause' }).click();
    
    // Wait for stats to update
    await page.waitForTimeout(1000);
    
    // Check that total sessions increased
    const newCount = parseInt(await totalSessionsElement.textContent() || '0');
    expect(newCount).toBe(initialCount + 1);
  });

  test('should show completion status in session history', async ({ page }) => {
    // Start and complete a session normally
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Pause' }).click();
    
    // Check for incomplete indicator (X icon)
    const recentSessions = page.locator('text=Recent Sessions').locator('..');
    await expect(recentSessions.locator('[data-testid="x-circle-icon"], svg.text-red-600')).toBeVisible();
  });

  test('should handle active session restoration', async ({ page }) => {
    // Start a session
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(2000);
    
    // Refresh the page
    await page.reload();
    
    // Navigate back to Pomodoro tab
    await page.getByRole('button', { name: 'Pomodoro' }).click();
    
    // Timer should still be running (pause button visible)
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    
    // Timer should show less than 25:00
    const timerText = await page.locator('.text-6xl').textContent();
    expect(timerText).not.toBe('25:00');
  });

  test('should calculate daily statistics correctly', async ({ page }) => {
    // Complete multiple sessions
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Start' }).click();
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'Pause' }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: 'Reset' }).click();
    }
    
    // Check daily activity section
    await expect(page.getByText('Daily Activity')).toBeVisible();
    
    // Today's stats should be visible
    const dailyActivity = page.locator('text=Daily Activity').locator('..');
    const todayDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    await expect(dailyActivity.getByText(todayDate)).toBeVisible();
    await expect(dailyActivity.getByText(/\d+ sessions/)).toBeVisible();
  });

  test('should calculate work and break time correctly', async ({ page }) => {
    // Complete a work session
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Pause' }).click();
    
    // Complete a break session
    await page.getByRole('button', { name: 'Short Break' }).click();
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Pause' }).click();
    
    // Check that work time and break time are displayed
    await expect(page.locator('text=Work Time').locator('..')).toContainText(/\d+m/);
    await expect(page.locator('text=Break Time').locator('..')).toContainText(/\d+m/);
  });

  test('should display session duration correctly', async ({ page }) => {
    // Use a short work session for testing
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByLabel('Work Duration (min)').clear();
    await page.getByLabel('Work Duration (min)').fill('1');
    await page.getByRole('button', { name: 'Save Settings' }).click();
    
    // Timer should show 01:00
    await expect(page.getByText('01:00')).toBeVisible();
    
    // Start and complete the session
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Pause' }).click();
    
    // Check session shows 1 min duration
    const recentSessions = page.locator('text=Recent Sessions').locator('..');
    await expect(recentSessions.getByText('1 min')).toBeVisible();
  });
});