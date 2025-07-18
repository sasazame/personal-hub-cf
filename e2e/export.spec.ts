import { test, expect } from './fixtures/base-test';
import fs from 'fs/promises';

test.describe('Data Export', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test('should display export dialog when clicking export button', async ({ authenticatedPage }) => {
    // Click export button
    await authenticatedPage.getByRole('button', { name: 'Export Data' }).click();
    
    // Verify dialog is visible
    await expect(authenticatedPage.getByRole('heading', { name: 'Export Data' })).toBeVisible();
    await expect(authenticatedPage.getByText('Select the data you want to export')).toBeVisible();
    
    // Verify all export options are available
    const exportOptions = ['Todos', 'Goals', 'Events', 'Notes', 'Moments', 'Pomodoro Sessions'];
    for (const option of exportOptions) {
      await expect(authenticatedPage.getByLabel(option)).toBeVisible();
    }
    
    // Verify format options
    await expect(authenticatedPage.getByLabel('Export Format')).toBeVisible();
  });

  test('should show error when no items selected', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: 'Export Data' }).click();
    await authenticatedPage.getByRole('button', { name: 'Export' }).click();
    
    // Verify error toast
    await expect(authenticatedPage.getByText('No items selected')).toBeVisible();
    await expect(authenticatedPage.getByText('Please select at least one type')).toBeVisible();
  });

  test('should export todos as JSON', async ({ authenticatedPage }) => {
    // Create a todo first
    await authenticatedPage.goto('http://localhost:5173');
    await authenticatedPage.getByRole('button', { name: 'Todos' }).click();
    await authenticatedPage.getByRole('button', { name: 'Add Todo' }).click();
    await authenticatedPage.getByPlaceholder('What needs to be done?').fill('Test Todo for Export');
    await authenticatedPage.getByRole('button', { name: 'Create' }).click();
    await authenticatedPage.waitForTimeout(1000);

    // Set up download promise
    const downloadPromise = authenticatedPage.waitForEvent('download');

    // Open export dialog and export todos
    await authenticatedPage.getByRole('button', { name: 'Export Data' }).click();
    await authenticatedPage.getByLabel('Todos').check();
    await authenticatedPage.getByRole('button', { name: 'Export' }).click();

    // Wait for download
    const download = await downloadPromise;
    
    // Verify download filename
    expect(download.suggestedFilename()).toMatch(/todos-export-.*\.json/);
    
    // Save and verify content
    const downloadPath = await download.path();
    if (downloadPath) {
      const content = await fs.readFile(downloadPath, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data).toHaveProperty('metadata');
      expect(data).toHaveProperty('data');
      expect(data.metadata).toHaveProperty('exportDate');
      expect(data.metadata).toHaveProperty('recordCount');
      expect(Array.isArray(data.data)).toBe(true);
      
      // Check if our test todo is in the export
      interface TodoData {
        title: string;
        id: string;
      }
      
      const testTodo = data.data.find((todo: TodoData) => todo.title === 'Test Todo for Export');
      expect(testTodo).toBeDefined();
    }
  });

  test('should export multiple types as CSV', async ({ authenticatedPage }) => {
    // Create test data
    await authenticatedPage.goto('http://localhost:5173');
    
    // Create a goal
    await authenticatedPage.getByRole('button', { name: 'Goals' }).click();
    await authenticatedPage.getByRole('button', { name: 'Add Goal' }).click();
    await authenticatedPage.getByPlaceholder('What do you want to achieve?').fill('Test Goal for Export');
    await authenticatedPage.getByRole('button', { name: 'Create' }).click();
    await authenticatedPage.waitForTimeout(1000);

    // Export todos and goals as CSV
    interface DownloadEvent {
      suggestedFilename(): string;
      path(): Promise<string | null>;
    }
    
    const downloads: DownloadEvent[] = [];
    
    authenticatedPage.on('download', download => {
      downloads.push(download);
    });

    await authenticatedPage.getByRole('button', { name: 'Export Data' }).click();
    await authenticatedPage.getByLabel('Todos').check();
    await authenticatedPage.getByLabel('Goals').check();
    await authenticatedPage.getByRole('combobox', { name: 'Export Format' }).click();
    await authenticatedPage.getByRole('option', { name: 'CSV' }).click();
    await authenticatedPage.getByRole('button', { name: 'Export' }).click();

    // Wait for downloads
    await authenticatedPage.waitForTimeout(2000);
    
    // Verify we got 2 downloads
    expect(downloads.length).toBe(2);
    
    // Verify filenames
    const filenames = downloads.map(d => d.suggestedFilename());
    expect(filenames.some(f => f.match(/todos-export-.*\.csv/))).toBe(true);
    expect(filenames.some(f => f.match(/goals-export-.*\.csv/))).toBe(true);
  });

  test('should filter exports by date range', async ({ authenticatedPage }) => {
    // Create todos with different dates
    await authenticatedPage.goto('http://localhost:5173');
    await authenticatedPage.getByRole('button', { name: 'Todos' }).click();
    
    // Create a todo
    await authenticatedPage.getByRole('button', { name: 'Add Todo' }).click();
    await authenticatedPage.getByPlaceholder('What needs to be done?').fill('Todo within date range');
    await authenticatedPage.getByRole('button', { name: 'Create' }).click();
    await authenticatedPage.waitForTimeout(1000);

    // Set up download promise
    const downloadPromise = authenticatedPage.waitForEvent('download');

    // Export with date range
    await authenticatedPage.getByRole('button', { name: 'Export Data' }).click();
    await authenticatedPage.getByLabel('Todos').check();
    
    // Set date range (today)
    const today = new Date().toISOString().split('T')[0];
    await authenticatedPage.getByLabel('From').fill(today);
    await authenticatedPage.getByLabel('To').fill(today);
    
    await authenticatedPage.getByRole('button', { name: 'Export' }).click();

    // Wait for download
    const download = await downloadPromise;
    const downloadPath = await download.path();
    
    if (downloadPath) {
      const content = await fs.readFile(downloadPath, 'utf-8');
      const data = JSON.parse(content);
      
      // Verify filters are included in metadata
      expect(data.metadata.filters).toHaveProperty('dateFrom');
      expect(data.metadata.filters).toHaveProperty('dateTo');
    }
  });

  test('should show success message after export', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: 'Export Data' }).click();
    await authenticatedPage.getByLabel('Todos').check();
    
    // Set up download listener to prevent actual download
    authenticatedPage.on('download', download => download.cancel());
    
    await authenticatedPage.getByRole('button', { name: 'Export' }).click();
    
    // Verify success toast
    await expect(authenticatedPage.getByText('Export successful')).toBeVisible();
    await expect(authenticatedPage.getByText('Your data has been exported')).toBeVisible();
  });

  test('should close dialog after successful export', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('button', { name: 'Export Data' }).click();
    await authenticatedPage.getByLabel('Todos').check();
    
    // Set up download listener
    authenticatedPage.on('download', download => download.cancel());
    
    await authenticatedPage.getByRole('button', { name: 'Export' }).click();
    
    // Wait for dialog to close
    await expect(authenticatedPage.getByRole('heading', { name: 'Export Data' })).not.toBeVisible();
  });
});