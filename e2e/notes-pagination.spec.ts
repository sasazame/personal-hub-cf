import { test, expect } from './fixtures/base-test';

test.describe('Notes Pagination', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await authenticatedPage;
    // Navigate to Notes tab
    await page.getByRole('button', { name: 'Notes' }).click();
    await page.waitForLoadState('networkidle');
    
    // Create 25 notes to test pagination (limit is 20 per page)
    for (let i = 1; i <= 25; i++) {
      await page.getByRole('button', { name: 'New Note' }).click();
      await page.getByLabel('Title').fill(`Note ${i.toString().padStart(2, '0')}`);
      await page.getByLabel('Content (Markdown supported)').fill(`Content for note ${i}`);
      
      // Add a tag to some notes
      if (i % 3 === 0) {
        await page.getByPlaceholder('Add a tag and press Enter').fill('important');
        await page.getByPlaceholder('Add a tag and press Enter').press('Enter');
      }
      
      await page.getByRole('button', { name: 'Create' }).click();
      // Wait for the note to appear in the list before creating the next one
      await page.waitForSelector(`.text-lg.font-semibold:has-text("Note ${i.toString().padStart(2, '0')}")`, { timeout: 5000 });
    }
  });

  test('should paginate notes correctly', async ({ page }) => {
    // First page should show 20 notes
    const notesOnFirstPage = await page.locator('.text-lg.font-semibold').count();
    expect(notesOnFirstPage).toBe(20);
    
    // Should show pagination controls
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
    
    // Navigate to second page
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForLoadState('networkidle');
    
    // Second page should show 5 notes
    const notesOnSecondPage = await page.locator('.text-lg.font-semibold').count();
    expect(notesOnSecondPage).toBe(5);
    
    // Pagination controls should update
    await expect(page.getByText('Page 2 of 2')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
    
    // Navigate back to first page
    await page.getByRole('button', { name: 'Previous' }).click();
    await page.waitForLoadState('networkidle');
    
    // Should be back on first page
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
    const notesOnFirstPageAgain = await page.locator('.text-lg.font-semibold').count();
    expect(notesOnFirstPageAgain).toBe(20);
  });

  test('should reset pagination when filtering', async ({ page }) => {
    // Go to second page
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Page 2 of 2')).toBeVisible();
    
    // Apply search filter
    await page.getByPlaceholder('Search notes...').fill('Note 1');
    await page.waitForLoadState('networkidle');
    
    // Should reset to page 1
    await expect(page.getByText('Page 1 of')).toBeVisible();
    
    // Should show filtered results
    const filteredNotes = await page.locator('.text-lg.font-semibold').count();
    expect(filteredNotes).toBeLessThanOrEqual(11); // Notes 1, 10-19
  });

  test('should handle pagination with tag filtering', async ({ page }) => {
    // Filter by important tag (every 3rd note has this tag)
    await page.getByRole('button', { name: 'important' }).first().click();
    
    // Should show filtered notes with pagination
    const filteredNotes = await page.locator('.text-lg.font-semibold').count();
    expect(filteredNotes).toBeLessThanOrEqual(8); // About 8 notes should have the tag
    
    // Pagination should not be visible if all filtered notes fit on one page
    const paginationVisible = await page.getByText('Page 1 of').isVisible().catch(() => false);
    expect(paginationVisible).toBe(false);
  });

  test('should maintain sort order across pages', async ({ page }) => {
    // Sort by title ascending
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Title' }).click();
    await page.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: 'Oldest' }).click();
    await page.waitForLoadState('networkidle');
    
    // First page should start with Note 01
    const firstNoteFirstPage = await page.locator('.text-lg.font-semibold').first().textContent();
    expect(firstNoteFirstPage).toBe('Note 01');
    
    // Go to second page
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForLoadState('networkidle');
    
    // Second page should continue the sequence
    const firstNoteSecondPage = await page.locator('.text-lg.font-semibold').first().textContent();
    expect(firstNoteSecondPage).toBe('Note 21');
  });
});