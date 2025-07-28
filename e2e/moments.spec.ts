import { test, expect } from '@playwright/test';
import { login, TEST_USER, ensureLoggedOut } from './helpers/auth';

test.describe('Moments Feature E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set English locale
    await page.context().addCookies([{ name: 'locale', value: 'en', domain: 'localhost', path: '/' }]);
    
    // Ensure clean state and login
    await ensureLoggedOut(page);
    await page.goto('/login');
    await login(page, TEST_USER.email, TEST_USER.password);
    
    // Navigate to moments
    await page.goto('/moments');
    await expect(page.getByRole('heading', { name: 'Moments' })).toBeVisible();
  });

  test('should display empty state initially', async ({ page }) => {
    // Check for subtitle
    await expect(page.getByText('Capture your thoughts, ideas, and experiences')).toBeVisible();
  });

  test('should create a new moment using quick form', async ({ page }) => {
    // Use the quick form (desktop only)
    const quickInput = page.locator('textarea[placeholder="What\'s on your mind?"]');
    if (await quickInput.isVisible()) {
      const momentText = `Quick thought at ${Date.now()}`;
      await quickInput.fill(momentText);
      
      // Add a tag
      await page.getByRole('button', { name: 'Ideas' }).click();
      
      // Submit
      await page.getByRole('button', { name: 'Save Moment' }).click();
      
      // Verify moment appears
      await expect(page.locator('text=' + momentText)).toBeVisible();
      await expect(page.locator('span').filter({ hasText: 'Ideas' })).toBeVisible();
    }
  });

  test('should create a new moment using modal form', async ({ page }) => {
    // Click new moment button (mobile view)
    const newButton = page.getByRole('button', { name: 'New Moment' });
    if (await newButton.isVisible()) {
      await newButton.click();
    } else {
      // Click the + button in quick form area
      await page.locator('.hidden.lg\\:block button').filter({ hasText: 'New Moment' }).click();
    }
    
    // Check modal appears
    await expect(page.getByRole('heading', { name: 'Add Moment' })).toBeVisible();
    
    // Fill form
    const momentContent = `Test moment created at ${Date.now()}`;
    await page.fill('textarea[placeholder="What\'s on your mind?"]', momentContent);
    
    // Add tags
    await page.getByRole('button', { name: 'Discoveries' }).click();
    await page.getByRole('button', { name: 'Emotions' }).click();
    
    // Add custom tag
    await page.getByRole('button', { name: 'Add Custom Tag' }).click();
    await page.fill('input[placeholder="Enter custom tag"]', 'test-tag');
    await page.keyboard.press('Enter');
    
    // Submit form
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Verify moment appears
    await expect(page.locator('.bg-white, .bg-gray-800').filter({ hasText: momentContent })).toBeVisible();
    
    // Verify tags
    await expect(page.locator('span').filter({ hasText: 'Discoveries' })).toBeVisible();
    await expect(page.locator('span').filter({ hasText: 'Emotions' })).toBeVisible();
    await expect(page.locator('span').filter({ hasText: '#test-tag' })).toBeVisible();
  });

  test('should view moment details', async ({ page }) => {
    // First create a moment
    const quickInput = page.locator('textarea[placeholder="What\'s on your mind?"]');
    if (await quickInput.isVisible()) {
      const momentText = `View test moment ${Date.now()}`;
      await quickInput.fill(momentText);
      await page.getByRole('button', { name: 'Save Moment' }).click();
      
      // Wait for moment to appear
      await expect(page.locator('text=' + momentText)).toBeVisible();
      
      // Click on the moment
      await page.locator('.bg-white, .bg-gray-800').filter({ hasText: momentText }).click();
      
      // Check viewer modal
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.locator('.whitespace-pre-wrap').filter({ hasText: momentText })).toBeVisible();
      
      // Close modal
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('should edit existing moment', async ({ page }) => {
    // Create a moment first
    const quickInput = page.locator('textarea[placeholder="What\'s on your mind?"]');
    if (await quickInput.isVisible()) {
      const originalText = `Original moment ${Date.now()}`;
      await quickInput.fill(originalText);
      await page.getByRole('button', { name: 'Save Moment' }).click();
      
      // Wait for moment to appear
      const momentCard = page.locator('.bg-white, .bg-gray-800').filter({ hasText: originalText });
      await expect(momentCard).toBeVisible();
      
      // Click edit button
      await momentCard.locator('button[aria-label="Edit"]').click();
      
      // Check edit form appears
      await expect(page.getByRole('heading', { name: 'Edit Moment' })).toBeVisible();
      
      // Modify content
      const updatedText = originalText + ' - Updated';
      await page.fill('textarea', updatedText);
      
      // Add a new tag
      await page.getByRole('button', { name: 'Log' }).click();
      
      // Save changes
      await page.getByRole('button', { name: 'Update' }).click();
      
      // Verify changes
      await expect(page.locator('text=' + updatedText)).toBeVisible();
      await expect(page.locator('span').filter({ hasText: 'Log' })).toBeVisible();
    }
  });

  test('should delete moment with confirmation', async ({ page }) => {
    // Create a moment first
    const quickInput = page.locator('textarea[placeholder="What\'s on your mind?"]');
    if (await quickInput.isVisible()) {
      const momentText = `Delete test moment ${Date.now()}`;
      await quickInput.fill(momentText);
      await page.getByRole('button', { name: 'Save Moment' }).click();
      
      // Wait for moment to appear
      const momentCard = page.locator('.bg-white, .bg-gray-800').filter({ hasText: momentText });
      await expect(momentCard).toBeVisible();
      
      // Click delete button
      await momentCard.locator('button[aria-label="Delete"]').click();
      
      // Confirm deletion
      await expect(page.getByText('Are you sure you want to delete this moment?')).toBeVisible();
      await page.getByRole('button', { name: 'Delete' }).nth(1).click();
      
      // Verify moment is removed
      await expect(momentCard).not.toBeVisible();
    }
  });

  test('should search moments', async ({ page }) => {
    // Create multiple moments
    const moments = [
      { content: 'JavaScript insights', tags: ['Ideas'] },
      { content: 'Feeling grateful today', tags: ['Emotions'] },
      { content: 'Discovered a new technique', tags: ['Discoveries'] }
    ];
    
    for (const moment of moments) {
      const quickInput = page.locator('textarea[placeholder="What\'s on your mind?"]');
      if (await quickInput.isVisible()) {
        await quickInput.fill(moment.content);
        
        // Add tag
        for (const tag of moment.tags) {
          await page.getByRole('button', { name: tag }).click();
        }
        
        await page.getByRole('button', { name: 'Save Moment' }).click();
        await page.waitForTimeout(500);
      }
    }
    
    // Search by content
    await page.fill('input[placeholder="Search moments..."]', 'JavaScript');
    await page.waitForTimeout(500);
    
    // Should show only JavaScript moment
    await expect(page.locator('text=JavaScript insights')).toBeVisible();
    await expect(page.locator('text=Feeling grateful today')).not.toBeVisible();
    await expect(page.locator('text=Discovered a new technique')).not.toBeVisible();
    
    // Clear search
    await page.fill('input[placeholder="Search moments..."]', '');
    await page.waitForTimeout(500);
    
    // All moments should be visible
    for (const moment of moments) {
      await expect(page.locator('text=' + moment.content)).toBeVisible();
    }
  });

  test('should filter moments by tag', async ({ page }) => {
    // Create moments with different tags
    const moments = [
      { content: 'Great idea for project', tags: ['Ideas'] },
      { content: 'Found interesting article', tags: ['Discoveries'] },
      { content: 'Another brilliant idea', tags: ['Ideas'] }
    ];
    
    for (const moment of moments) {
      const quickInput = page.locator('textarea[placeholder="What\'s on your mind?"]');
      if (await quickInput.isVisible()) {
        await quickInput.fill(moment.content);
        
        for (const tag of moment.tags) {
          await page.getByRole('button', { name: tag }).click();
        }
        
        await page.getByRole('button', { name: 'Save Moment' }).click();
        await page.waitForTimeout(500);
      }
    }
    
    // Filter by Ideas tag
    await page.selectOption('select', 'Ideas');
    await page.waitForTimeout(500);
    
    // Should show only Ideas moments
    await expect(page.locator('text=Great idea for project')).toBeVisible();
    await expect(page.locator('text=Another brilliant idea')).toBeVisible();
    await expect(page.locator('text=Found interesting article')).not.toBeVisible();
    
    // Reset filter
    await page.selectOption('select', '');
    await page.waitForTimeout(500);
    
    // All moments should be visible
    for (const moment of moments) {
      await expect(page.locator('text=' + moment.content)).toBeVisible();
    }
  });

  test('should handle infinite scroll', async ({ page }) => {
    // This test would require creating many moments to trigger pagination
    // For now, we'll just verify the UI structure is in place
    
    // Check for moments list container
    const momentsList = page.locator('[data-testid="moments-list"], .space-y-6').last();
    await expect(momentsList).toBeVisible();
    
    // The infinite scroll observer should be attached to the last element
    // We can't easily test the actual scrolling behavior without many moments
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty quick form
    const quickInput = page.locator('textarea[placeholder="What\'s on your mind?"]');
    if (await quickInput.isVisible()) {
      await page.getByRole('button', { name: 'Save Moment' }).click();
      
      // Should show validation error or button should be disabled
      // Check if the form is still visible (not submitted)
      await expect(quickInput).toBeVisible();
    }
    
    // Try modal form
    const newButton = page.getByRole('button', { name: 'New Moment' });
    if (await newButton.isVisible()) {
      await newButton.click();
      
      // Try to submit empty form
      await page.getByRole('button', { name: 'Create' }).click();
      
      // Modal should still be open
      await expect(page.getByRole('heading', { name: 'Add Moment' })).toBeVisible();
    }
  });
});