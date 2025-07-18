import { test, expect } from './fixtures/base-test';

test.describe('Notes Filtering and Search', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await authenticatedPage;
    // Navigate to Notes tab
    await page.getByRole('button', { name: 'Notes' }).click();
    await page.waitForLoadState('networkidle');
    
    // Create test notes
    const notes = [
      {
        title: 'JavaScript Tutorial',
        content: 'Learn JavaScript basics',
        tags: ['programming', 'javascript']
      },
      {
        title: 'Python Guide',
        content: 'Python programming fundamentals',
        tags: ['programming', 'python']
      },
      {
        title: 'Meeting Notes',
        content: 'Important meeting discussion points',
        tags: ['work', 'meetings']
      },
      {
        title: 'Recipe Collection',
        content: 'Favorite recipes and cooking tips',
        tags: ['personal', 'cooking']
      }
    ];
    
    // Create notes
    for (const note of notes) {
      await page.getByRole('button', { name: 'New Note' }).click();
      await page.getByLabel('Title').fill(note.title);
      await page.getByLabel('Content (Markdown supported)').fill(note.content);
      
      // Add tags
      for (const tag of note.tags) {
        await page.getByPlaceholder('Add a tag and press Enter').fill(tag);
        await page.getByPlaceholder('Add a tag and press Enter').press('Enter');
      }
      
      await page.getByRole('button', { name: 'Create' }).click();
      await page.waitForLoadState('networkidle'); // Wait for creation to complete
    }
  });

  test('should search notes by title', async ({ page }) => {
    // Search for JavaScript
    await page.getByPlaceholder('Search notes...').fill('JavaScript');
    await page.waitForLoadState('networkidle'); // Debounce delay
    
    // Should show JavaScript Tutorial
    await expect(page.getByText('JavaScript Tutorial')).toBeVisible();
    
    // Should not show other notes
    await expect(page.getByText('Python Guide')).not.toBeVisible();
    await expect(page.getByText('Meeting Notes')).not.toBeVisible();
    await expect(page.getByText('Recipe Collection')).not.toBeVisible();
  });

  test('should search notes by content', async ({ page }) => {
    // Search for programming
    await page.getByPlaceholder('Search notes...').fill('programming');
    await page.waitForLoadState('networkidle');
    
    // Should show programming-related notes
    await expect(page.getByText('Python Guide')).toBeVisible();
    
    // Should not show non-programming notes
    await expect(page.getByText('Meeting Notes')).not.toBeVisible();
    await expect(page.getByText('Recipe Collection')).not.toBeVisible();
  });

  test('should filter notes by tags', async ({ page }) => {
    // Click on programming tag
    await page.getByRole('button', { name: 'programming' }).first().click();
    
    // Should show programming notes
    await expect(page.getByText('JavaScript Tutorial')).toBeVisible();
    await expect(page.getByText('Python Guide')).toBeVisible();
    
    // Should not show other notes
    await expect(page.getByText('Meeting Notes')).not.toBeVisible();
    await expect(page.getByText('Recipe Collection')).not.toBeVisible();
    
    // Click on work tag (multi-select)
    await page.getByRole('button', { name: 'work' }).click();
    
    // Should now show programming + work notes
    await expect(page.getByText('JavaScript Tutorial')).toBeVisible();
    await expect(page.getByText('Python Guide')).toBeVisible();
    await expect(page.getByText('Meeting Notes')).toBeVisible();
    
    // Should still not show personal notes
    await expect(page.getByText('Recipe Collection')).not.toBeVisible();
  });

  test('should combine search and tag filtering', async ({ page }) => {
    // Filter by programming tag
    await page.getByRole('button', { name: 'programming' }).first().click();
    
    // Then search for Python
    await page.getByPlaceholder('Search notes...').fill('Python');
    await page.waitForLoadState('networkidle');
    
    // Should only show Python Guide (has programming tag AND matches search)
    await expect(page.getByText('Python Guide')).toBeVisible();
    await expect(page.getByText('JavaScript Tutorial')).not.toBeVisible();
    await expect(page.getByText('Meeting Notes')).not.toBeVisible();
    await expect(page.getByText('Recipe Collection')).not.toBeVisible();
  });

  test('should sort notes', async ({ page }) => {
    // Default sort is by updated date (newest first)
    // Since we created them in order, Recipe Collection should be first
    const firstNoteTitle = await page.locator('.text-lg.font-semibold').first().textContent();
    expect(firstNoteTitle).toBe('Recipe Collection');
    
    // Sort by title
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Title' }).click();
    
    // Wait for sort to apply
    await page.waitForLoadState('networkidle');
    
    // JavaScript Tutorial should now be first (alphabetically)
    const sortedFirstTitle = await page.locator('.text-lg.font-semibold').first().textContent();
    expect(sortedFirstTitle).toBe('JavaScript Tutorial');
    
    // Change sort order to ascending
    await page.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: 'Oldest' }).click();
    
    await page.waitForLoadState('networkidle');
    
    // Recipe Collection should be last now
    const lastNoteTitle = await page.locator('.text-lg.font-semibold').last().textContent();
    expect(lastNoteTitle).toBe('Recipe Collection');
  });

  test('should show no results message', async ({ page }) => {
    // Search for non-existent content
    await page.getByPlaceholder('Search notes...').fill('nonexistentcontent12345');
    await page.waitForLoadState('networkidle');
    
    // Should show no results message
    await expect(page.getByText('No notes found matching your criteria')).toBeVisible();
    
    // Clear search
    await page.getByPlaceholder('Search notes...').clear();
    await page.waitForLoadState('networkidle');
    
    // Filter by non-selected tag combination
    await page.getByRole('button', { name: 'programming' }).first().click();
    await page.getByRole('button', { name: 'cooking' }).click();
    
    // Should show no results (no note has both tags)
    await expect(page.getByText('No notes found matching your criteria')).toBeVisible();
  });

  test('should clear filters', async ({ page }) => {
    // Apply multiple filters
    await page.getByRole('button', { name: 'programming' }).first().click();
    await page.getByPlaceholder('Search notes...').fill('JavaScript');
    await page.waitForLoadState('networkidle');
    
    // Should show filtered results
    await expect(page.getByText('JavaScript Tutorial')).toBeVisible();
    await expect(page.getByText('Python Guide')).not.toBeVisible();
    
    // Clear search
    await page.getByPlaceholder('Search notes...').clear();
    await page.waitForLoadState('networkidle');
    
    // Should still be filtered by tag
    await expect(page.getByText('JavaScript Tutorial')).toBeVisible();
    await expect(page.getByText('Python Guide')).toBeVisible();
    await expect(page.getByText('Meeting Notes')).not.toBeVisible();
    
    // Unselect tag
    await page.getByRole('button', { name: 'programming' }).first().click();
    
    // Should show all notes
    await expect(page.getByText('JavaScript Tutorial')).toBeVisible();
    await expect(page.getByText('Python Guide')).toBeVisible();
    await expect(page.getByText('Meeting Notes')).toBeVisible();
    await expect(page.getByText('Recipe Collection')).toBeVisible();
  });
});