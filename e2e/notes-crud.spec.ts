import { test, expect } from './fixtures/base-test';

test.describe('Notes CRUD Operations', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await authenticatedPage;
    // Navigate to Notes tab
    await page.getByRole('button', { name: 'Notes' }).click();
    await page.waitForLoadState('networkidle');
  });

  test('should create a new note', async ({ page }) => {
    // Open create note dialog
    await page.getByRole('button', { name: 'New Note' }).click();
    
    // Fill in note details
    const noteTitle = `Test Note ${Date.now()}`;
    await page.getByLabel('Title').fill(noteTitle);
    await page.getByLabel('Content (Markdown supported)').fill('# Test Content\n\nThis is a **test** note with *markdown*.');
    
    // Add tags
    await page.getByPlaceholder('Add a tag and press Enter').fill('test-tag');
    await page.getByPlaceholder('Add a tag and press Enter').press('Enter');
    await page.getByPlaceholder('Add a tag and press Enter').fill('important');
    await page.getByPlaceholder('Add a tag and press Enter').press('Enter');
    
    // Submit form
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Verify note appears in list
    await expect(page.getByText(noteTitle)).toBeVisible();
    await expect(page.getByText('test-tag')).toBeVisible();
    await expect(page.getByText('important')).toBeVisible();
  });

  test('should preview markdown content', async ({ page }) => {
    // Create a note with markdown
    await page.getByRole('button', { name: 'New Note' }).click();
    
    const noteTitle = `Markdown Note ${Date.now()}`;
    const markdownContent = `# Heading 1
## Heading 2
**Bold text**
*Italic text*
- List item 1
- List item 2

[Link text](https://example.com)`;
    
    await page.getByLabel('Title').fill(noteTitle);
    await page.getByLabel('Content (Markdown supported)').fill(markdownContent);
    
    // Toggle preview
    await page.getByRole('button', { name: 'Preview' }).click();
    
    // Verify markdown is rendered
    await expect(page.getByRole('heading', { name: 'Heading 1' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Heading 2' })).toBeVisible();
    await expect(page.getByText('Bold text')).toHaveCSS('font-weight', '700');
    await expect(page.getByText('Italic text')).toHaveCSS('font-style', 'italic');
    
    // Toggle back to edit
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByLabel('Content (Markdown supported)')).toBeVisible();
    
    // Create the note
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Verify note is created
    await expect(page.getByText(noteTitle)).toBeVisible();
    
    // Preview in list
    await page.getByRole('button', { name: 'Show preview' }).first().click();
    await expect(page.getByRole('heading', { name: 'Heading 1' })).toBeVisible();
  });

  test('should edit an existing note', async ({ page }) => {
    // Create a note first
    await page.getByRole('button', { name: 'New Note' }).click();
    const originalTitle = `Original Note ${Date.now()}`;
    await page.getByLabel('Title').fill(originalTitle);
    await page.getByLabel('Content (Markdown supported)').fill('Original content');
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Wait for note to appear
    await expect(page.getByText(originalTitle)).toBeVisible();
    
    // Click edit button
    await page.locator('[aria-label="Edit"]').first().click();
    
    // Update note details
    const updatedTitle = `Updated Note ${Date.now()}`;
    await page.getByLabel('Title').clear();
    await page.getByLabel('Title').fill(updatedTitle);
    await page.getByLabel('Content (Markdown supported)').clear();
    await page.getByLabel('Content (Markdown supported)').fill('Updated content with **markdown**');
    
    // Add a new tag
    await page.getByPlaceholder('Add a tag and press Enter').fill('updated-tag');
    await page.getByPlaceholder('Add a tag and press Enter').press('Enter');
    
    // Submit changes
    await page.getByRole('button', { name: 'Update' }).click();
    
    // Verify changes
    await expect(page.getByText(updatedTitle)).toBeVisible();
    await expect(page.getByText('updated-tag')).toBeVisible();
    await expect(page.getByText(originalTitle)).not.toBeVisible();
  });

  test('should delete a note', async ({ page }) => {
    // Create a note first
    await page.getByRole('button', { name: 'New Note' }).click();
    const noteTitle = `Delete Me ${Date.now()}`;
    await page.getByLabel('Title').fill(noteTitle);
    await page.getByLabel('Content (Markdown supported)').fill('This note will be deleted');
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Wait for note to appear
    await expect(page.getByText(noteTitle)).toBeVisible();
    
    // Click delete button
    await page.locator('[aria-label="Delete"]').first().click();
    
    // Confirm deletion
    await page.getByRole('button', { name: 'Delete' }).click();
    
    // Verify note is deleted
    await expect(page.getByText(noteTitle)).not.toBeVisible();
  });

  test('should handle tag management', async ({ page }) => {
    await page.getByRole('button', { name: 'New Note' }).click();
    
    const noteTitle = `Tagged Note ${Date.now()}`;
    await page.getByLabel('Title').fill(noteTitle);
    
    // Add tags
    await page.getByPlaceholder('Add a tag and press Enter').fill('tag1');
    await page.getByPlaceholder('Add a tag and press Enter').press('Enter');
    await page.getByPlaceholder('Add a tag and press Enter').fill('tag2');
    await page.getByPlaceholder('Add a tag and press Enter').press('Enter');
    await page.getByPlaceholder('Add a tag and press Enter').fill('tag3');
    await page.getByPlaceholder('Add a tag and press Enter').press('Enter');
    
    // Verify tags are shown
    await expect(page.getByText('tag1')).toBeVisible();
    await expect(page.getByText('tag2')).toBeVisible();
    await expect(page.getByText('tag3')).toBeVisible();
    
    // Remove a tag
    await page.locator('button', { hasText: 'tag2' }).locator('button').click();
    await expect(page.getByText('tag2')).not.toBeVisible();
    
    // Create note
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Verify only remaining tags are shown
    await expect(page.getByText('tag1')).toBeVisible();
    await expect(page.getByText('tag3')).toBeVisible();
    await expect(page.locator('text=tag2').first()).not.toBeVisible();
  });
});