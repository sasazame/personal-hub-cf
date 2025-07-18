import { test, expect } from './fixtures/base-test';
import { login } from './helpers/auth';

test.describe('Pomodoro Timer', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/');
    
    // Navigate to Pomodoro tab
    await page.getByRole('button', { name: 'Pomodoro' }).click();
    await expect(page.getByText('Pomodoro Timer')).toBeVisible();
  });

  test('should display timer with default settings', async ({ page }) => {
    // Check default timer display
    await expect(page.getByText('25:00')).toBeVisible();
    await expect(page.getByText('Session 1')).toBeVisible();
    
    // Check session type buttons
    await expect(page.getByRole('button', { name: 'Work' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Short Break' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Long Break' })).toBeVisible();
    
    // Check control buttons
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
  });

  test('should switch between session types', async ({ page }) => {
    // Switch to short break
    await page.getByRole('button', { name: 'Short Break' }).click();
    await expect(page.getByText('05:00')).toBeVisible();
    
    // Switch to long break
    await page.getByRole('button', { name: 'Long Break' }).click();
    await expect(page.getByText('15:00')).toBeVisible();
    
    // Switch back to work
    await page.getByRole('button', { name: 'Work' }).click();
    await expect(page.getByText('25:00')).toBeVisible();
  });

  test('should start and pause timer', async ({ page }) => {
    // Start timer
    await page.getByRole('button', { name: 'Start' }).click();
    
    // Pause button should appear
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    
    // Wait a moment and check timer is counting down
    await page.waitForTimeout(2000);
    await expect(page.getByText('24:58')).toBeVisible();
    
    // Pause timer
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  });

  test('should reset timer', async ({ page }) => {
    // Start timer
    await page.getByRole('button', { name: 'Start' }).click();
    
    // Wait for countdown
    await page.waitForTimeout(2000);
    
    // Reset timer
    await page.getByRole('button', { name: 'Reset' }).click();
    
    // Timer should reset to 25:00
    await expect(page.getByText('25:00')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  });

  test('should open and update settings', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByText('Pomodoro Settings')).toBeVisible();
    
    // Update work duration
    await page.getByLabel('Work Duration (min)').clear();
    await page.getByLabel('Work Duration (min)').fill('30');
    
    // Update short break duration
    await page.getByLabel('Short Break (min)').clear();
    await page.getByLabel('Short Break (min)').fill('10');
    
    // Enable auto-start breaks
    await page.getByLabel('Auto-start breaks').check();
    
    // Save settings
    await page.getByRole('button', { name: 'Save Settings' }).click();
    
    // Check timer updated to new duration
    await expect(page.getByText('30:00')).toBeVisible();
  });

  test('should validate settings input', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: 'Settings' }).click();
    
    // Try to set invalid work duration
    await page.getByLabel('Work Duration (min)').clear();
    await page.getByLabel('Work Duration (min)').fill('100');
    
    // Save should fail with validation error
    await page.getByRole('button', { name: 'Save Settings' }).click();
    await expect(page.getByText('Pomodoro Settings')).toBeVisible(); // Dialog still open
  });

  test('should display session statistics', async ({ page }) => {
    // Stats should be visible
    await expect(page.getByText('Total Sessions')).toBeVisible();
    await expect(page.getByText('Completion Rate')).toBeVisible();
    await expect(page.getByText('Work Time')).toBeVisible();
    await expect(page.getByText('Break Time')).toBeVisible();
  });

  test('should create and display session in history', async ({ page }) => {
    // Start and quickly complete a session
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Pause' }).click();
    
    // Check recent sessions section
    await expect(page.getByText('Recent Sessions')).toBeVisible();
    await expect(page.getByText('Work')).toBeVisible();
    await expect(page.getByText('25 min')).toBeVisible();
  });

  test('should prevent session type change while timer is running', async ({ page }) => {
    // Start timer
    await page.getByRole('button', { name: 'Start' }).click();
    
    // Try to switch session type - buttons should be disabled
    const shortBreakButton = page.getByRole('button', { name: 'Short Break' });
    await expect(shortBreakButton).toBeDisabled();
    
    const longBreakButton = page.getByRole('button', { name: 'Long Break' });
    await expect(longBreakButton).toBeDisabled();
  });

  test('should handle auto-start settings', async ({ page }) => {
    // Open settings and enable auto-start
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByLabel('Auto-start breaks').check();
    await page.getByLabel('Auto-start work sessions').check();
    await page.getByRole('button', { name: 'Save Settings' }).click();
    
    // Settings should be saved (dialog closed)
    await expect(page.getByText('Pomodoro Settings')).not.toBeVisible();
  });
});