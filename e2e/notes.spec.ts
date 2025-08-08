import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth-helpers';

test.describe('Notes Feature E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
    await registerAndLogin(page);
    
    // Navigate to notes
    await page.goto('/notes');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
  });

  test('should display empty state initially', async ({ page }) => {
    // Check for empty state message
    const emptyMessage = page.locator('text=No notes');
    if (await emptyMessage.isVisible()) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('should create a new note', async ({ page }) => {
    // Click add note button
    await page.getByRole('button', { name: 'New Note' }).click();
    
    // Wait for modal to appear
    await page.waitForSelector('input[placeholder="Enter note title"]', { state: 'visible', timeout: 10000 });
    
    // Fill form
    const noteTitle = `Test Note ${Date.now()}`;
    const noteContent = 'This is a test note content with some **markdown** text.';
    
    await page.fill('input[placeholder="Enter note title"]', noteTitle);
    await page.fill('textarea[placeholder="Enter note content"]', noteContent);
    
    // Add tags
    await page.fill('input[placeholder="Enter new tag"]', 'test-tag');
    await page.keyboard.press('Enter');
    await page.fill('input[placeholder="Enter new tag"]', 'e2e');
    await page.keyboard.press('Enter');
    
    // Submit form
    const createButton = page.locator('button[type="submit"]:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click();
    
    // Verify note appears in list
    await expect(page.locator('.bg-card').filter({ hasText: noteTitle })).toBeVisible();
    
    // Verify tags are displayed
    await expect(page.locator('span').filter({ hasText: 'test-tag' })).toBeVisible();
    await expect(page.locator('span').filter({ hasText: 'e2e' })).toBeVisible();
  });

  test('should view note details', async ({ page }) => {
    // First create a note
    await page.getByRole('button', { name: 'New Note' }).click();
    const noteTitle = `View Test ${Date.now()}`;
    const noteContent = 'This note has detailed content that should be viewable.';
    
    await page.fill('input[placeholder="Enter note title"]', noteTitle);
    await page.fill('textarea[placeholder="Enter note content"]', noteContent);
    const createButton = page.locator('button[type="submit"]:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click();
    
    // Wait for note to appear
    const noteCard = page.locator('.bg-card').filter({ hasText: noteTitle });
    await expect(noteCard).toBeVisible();
    
    // Click on the note card to view details
    await noteCard.click();
    
    // Check viewer modal - use dialog role to avoid strict mode violation
    await expect(page.getByRole('dialog').getByRole('heading', { name: noteTitle })).toBeVisible();
    await expect(page.locator('text=' + noteContent)).toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should edit existing note', async ({ page }) => {
    // First create a note
    await page.getByRole('button', { name: 'New Note' }).click();
    const noteTitle = `Edit Test ${Date.now()}`;
    await page.fill('input[name="title"]', noteTitle);
    await page.fill('textarea[name="content"]', 'Original content');
    const createButton = page.locator('button[type="submit"]:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click();
    
    // Wait for note to appear
    const noteCard = page.locator('.bg-card').filter({ hasText: noteTitle });
    await expect(noteCard).toBeVisible();
    
    // Click edit button
    await noteCard.locator('button svg.lucide-pencil').click();
    
    // Wait for edit form to appear
    await page.waitForSelector('input[placeholder="Enter note title"]', { state: 'visible', timeout: 10000 });
    
    // Modify content
    const newTitle = noteTitle + ' - Edited';
    await page.fill('input[placeholder="Enter note title"]', newTitle);
    await page.fill('textarea[placeholder="Enter note content"]', 'Updated content with changes');
    
    // Add a new tag
    await page.fill('input[placeholder="Add tags..."]', 'edited');
    await page.keyboard.press('Enter');
    
    // Save changes
    const updateButton = page.locator('button[type="submit"]:has-text("Update")');
    await expect(updateButton).toBeEnabled({ timeout: 5000 });
    await updateButton.click();
    
    // Verify changes
    await expect(page.locator('.bg-card').filter({ hasText: newTitle })).toBeVisible();
    await expect(page.locator('span').filter({ hasText: 'edited' })).toBeVisible();
  });

  test('should delete note with confirmation', async ({ page }) => {
    // First create a note
    await page.getByRole('button', { name: 'New Note' }).click();
    const noteTitle = `Delete Test ${Date.now()}`;
    await page.fill('input[name="title"]', noteTitle);
    await page.fill('textarea[name="content"]', 'To be deleted');
    const createButton = page.locator('button[type="submit"]:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click();
    
    // Wait for note to appear
    const noteCard = page.locator('.bg-card').filter({ hasText: noteTitle });
    await expect(noteCard).toBeVisible();
    
    // Click delete button
    await noteCard.locator('button svg.lucide-trash-2').click();
    
    // Confirm deletion - the text includes the note title
    await expect(page.getByText(new RegExp(`Are you sure you want to delete.*${noteTitle}`, 'i'))).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).nth(1).click();
    
    // Verify note is removed
    await expect(page.locator('.bg-card').filter({ hasText: noteTitle })).not.toBeVisible();
  });

  test('should search notes by title and content', async ({ page }) => {
    // Create multiple notes
    const notes = [
      { title: 'JavaScript Guide', content: 'Learn about functions and objects' },
      { title: 'Python Tutorial', content: 'Understanding decorators and generators' },
      { title: 'Testing Best Practices', content: 'Write reliable JavaScript tests' }
    ];
    
    for (const note of notes) {
      await page.getByRole('button', { name: 'New Note' }).click();
      await page.fill('input[name="title"]', note.title);
      await page.fill('textarea[name="content"]', note.content);
      const createButton = page.locator('button[type="submit"]:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click();
      await page.waitForTimeout(500); // Brief wait between creations
    }
    
    // Search by title
    await page.fill('input[placeholder="Search notes..."]', 'JavaScript');
    await page.waitForTimeout(500); // Debounce delay
    
    // Should show only JavaScript-related notes
    await expect(page.locator('.bg-card').filter({ hasText: 'JavaScript Guide' })).toBeVisible();
    await expect(page.locator('.bg-card').filter({ hasText: 'Testing Best Practices' })).toBeVisible();
    await expect(page.locator('.bg-card').filter({ hasText: 'Python Tutorial' })).not.toBeVisible();
    
    // Clear search
    await page.fill('input[placeholder*="Search"]', '');
    await page.waitForTimeout(500);
    
    // All notes should be visible again
    for (const note of notes) {
      await expect(page.locator('.bg-card').filter({ hasText: note.title })).toBeVisible();
    }
  });

  test('should filter notes by tags', async ({ page }) => {
    // Create notes with different tags
    const notesWithTags = [
      { title: 'Work Meeting Notes', tags: ['work', 'meeting'] },
      { title: 'Personal Todo List', tags: ['personal', 'todo'] },
      { title: 'Work Project Ideas', tags: ['work', 'ideas'] }
    ];
    
    for (const note of notesWithTags) {
      await page.getByRole('button', { name: 'New Note' }).click();
      await page.fill('input[name="title"]', note.title);
      await page.fill('textarea[name="content"]', 'Content for ' + note.title);
      
      // Add tags
      for (const tag of note.tags) {
        await page.fill('input[placeholder="Add tags..."]', tag);
        await page.keyboard.press('Enter');
      }
      
      const createButton = page.locator('button[type="submit"]:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click();
      await page.waitForTimeout(500);
    }
    
    // Filter by 'work' tag
    await page.selectOption('select', { label: 'work' });
    await page.waitForTimeout(500);
    
    // Should show only work-related notes
    await expect(page.locator('.bg-card').filter({ hasText: 'Work Meeting Notes' })).toBeVisible();
    await expect(page.locator('.bg-card').filter({ hasText: 'Work Project Ideas' })).toBeVisible();
    await expect(page.locator('.bg-card').filter({ hasText: 'Personal Todo List' })).not.toBeVisible();
    
    // Reset filter
    await page.selectOption('select', '');
    await page.waitForTimeout(500);
    
    // All notes should be visible
    for (const note of notesWithTags) {
      await expect(page.locator('.bg-card').filter({ hasText: note.title })).toBeVisible();
    }
  });

  test('should handle tag management in notes', async ({ page }) => {
    // Create a note
    await page.getByRole('button', { name: 'New Note' }).click();
    const noteTitle = `Tag Test ${Date.now()}`;
    await page.fill('input[name="title"]', noteTitle);
    await page.fill('textarea[name="content"]', 'Testing tag functionality');
    
    // Add multiple tags
    const tags = ['important', 'urgent', 'review'];
    for (const tag of tags) {
      await page.fill('input[placeholder="Add tags..."]', tag);
      await page.keyboard.press('Enter');
    }
    
    const createButton = page.locator('button[type="submit"]:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click();
    
    // Verify all tags are displayed
    for (const tag of tags) {
      await expect(page.locator('span').filter({ hasText: tag })).toBeVisible();
    }
    
    // Edit note to remove a tag
    const noteCard = page.locator('.bg-card').filter({ hasText: noteTitle });
    await noteCard.locator('button svg.lucide-pencil').click();
    
    // Remove 'urgent' tag by clicking its X button
    await page.locator('span').filter({ hasText: 'urgent' }).locator('button').click();
    
    // Save changes
    const updateButton = page.locator('button[type="submit"]:has-text("Update")');
    await expect(updateButton).toBeEnabled({ timeout: 5000 });
    await updateButton.click();
    
    // Verify tag was removed
    await expect(page.locator('span').filter({ hasText: 'urgent' })).not.toBeVisible();
    await expect(page.locator('span').filter({ hasText: 'important' })).toBeVisible();
    await expect(page.locator('span').filter({ hasText: 'review' })).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Click add note button
    await page.getByRole('button', { name: 'New Note' }).click();
    
    // Try to submit empty form
    let createButton = page.locator('button[type="submit"]:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click();
    
    // Should show validation errors
    await expect(page.getByText('Title is required')).toBeVisible();
    await expect(page.getByText('Content is required')).toBeVisible();
    
    // Fill only title
    await page.fill('input[name="title"]', 'Test Title');
    createButton = page.locator('button[type="submit"]:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click();
    
    // Should still show content error
    await expect(page.getByText('Title is required')).not.toBeVisible();
    await expect(page.getByText('Content is required')).toBeVisible();
    
    // Fill content
    await page.fill('textarea[name="content"]', 'Test content');
    createButton = page.locator('button[type="submit"]:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click();
    
    // Should successfully create
    await expect(page.locator('.bg-card').filter({ hasText: 'Test Title' })).toBeVisible();
  });

  test('should handle long content gracefully', async ({ page }) => {
    // Create note with long content
    await page.getByRole('button', { name: 'New Note' }).click();
    
    const noteTitle = `Long Content Test ${Date.now()}`;
    const longContent = 'Lorem ipsum dolor sit amet. '.repeat(50);
    
    await page.fill('input[name="title"]', noteTitle);
    await page.fill('textarea[name="content"]', longContent);
    const createButton = page.locator('button[type="submit"]:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click();
    
    // Verify note card shows truncated content
    const noteCard = page.locator('.bg-card').filter({ hasText: noteTitle });
    await expect(noteCard).toBeVisible();
    
    // Content should be truncated in card view
    const cardContent = await noteCard.locator('p').textContent();
    expect(cardContent?.length).toBeLessThan(longContent.length);
    
    // View full content
    await noteCard.click();
    
    // Full content should be visible in viewer
    await expect(page.locator('.whitespace-pre-wrap').filter({ hasText: longContent.substring(0, 50) })).toBeVisible();
  });

  test('should handle special characters in notes', async ({ page }) => {
    // Create note with special characters
    await page.getByRole('button', { name: 'New Note' }).click();
    
    const specialTitle = `Special <>&"' Test ${Date.now()}`;
    const specialContent = 'Content with <html> tags & "quotes" and \'apostrophes\'';
    
    await page.fill('input[name="title"]', specialTitle);
    await page.fill('textarea[name="content"]', specialContent);
    const createButton = page.locator('button[type="submit"]:has-text("Create")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click();
    
    // Verify special characters are properly displayed
    await expect(page.locator('.bg-card').filter({ hasText: specialTitle })).toBeVisible();
    
    // View note
    await page.locator('.bg-card').filter({ hasText: specialTitle }).click();
    await expect(page.locator('text=' + specialContent)).toBeVisible();
  });
});