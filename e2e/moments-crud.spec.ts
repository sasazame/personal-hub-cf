import { test, expect } from './fixtures/base-test';

test.describe('Moments CRUD Operations', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await authenticatedPage;
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should create a new moment', async ({ page }) => {
    // Navigate to Moments tab
    await page.getByRole('button', { name: 'Moments' }).click();
    await page.waitForLoadState('networkidle');

    // Create a new moment
    const momentContent = 'Just had a great idea for the project!';
    await page.getByPlaceholder("What's on your mind?").fill(momentContent);
    
    // Add tags
    await page.getByPlaceholder('Add tags (press Enter)').fill('idea');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder('Add tags (press Enter)').fill('project');
    await page.keyboard.press('Enter');

    // Submit
    await page.getByRole('button', { name: 'Capture Moment' }).click();

    // Verify the moment appears
    await expect(page.getByText(momentContent)).toBeVisible();
    await expect(page.getByText('idea')).toBeVisible();
    await expect(page.getByText('project')).toBeVisible();
  });

  test('should update an existing moment', async ({ page }) => {
    // Navigate to Moments tab
    await page.getByRole('button', { name: 'Moments' }).click();
    await page.waitForLoadState('networkidle');

    // Create a moment first
    const originalContent = 'Original moment content';
    await page.getByPlaceholder("What's on your mind?").fill(originalContent);
    await page.getByRole('button', { name: 'Capture Moment' }).click();
    await expect(page.getByText(originalContent)).toBeVisible();

    // Edit the moment
    await page.locator('button[aria-label="Edit"]').first().click();
    await page.waitForSelector('textarea', { state: 'visible' });
    
    const updatedContent = 'Updated moment content with new thoughts';
    await page.getByRole('textbox').first().clear();
    await page.getByRole('textbox').first().fill(updatedContent);
    
    // Add a new tag
    await page.getByPlaceholder('Add tags (press Enter)').fill('updated');
    await page.keyboard.press('Enter');

    await page.getByRole('button', { name: 'Save' }).click();

    // Verify the update
    await expect(page.getByText(updatedContent)).toBeVisible();
    await expect(page.getByText('updated')).toBeVisible();
    await expect(page.getByText(originalContent)).not.toBeVisible();
  });

  test('should delete a moment', async ({ page }) => {
    // Navigate to Moments tab
    await page.getByRole('button', { name: 'Moments' }).click();
    await page.waitForLoadState('networkidle');

    // Create a moment to delete
    const momentToDelete = 'This moment will be deleted';
    await page.getByPlaceholder("What's on your mind?").fill(momentToDelete);
    await page.getByRole('button', { name: 'Capture Moment' }).click();
    await expect(page.getByText(momentToDelete)).toBeVisible();

    // Delete the moment
    await page.locator('button[aria-label="Delete"]').first().click();
    
    // Confirm deletion in the dialog
    await page.getByRole('button', { name: 'Delete' }).click();

    // Verify the moment is deleted
    await expect(page.getByText(momentToDelete)).not.toBeVisible();
  });

  test('should handle empty moment submission', async ({ page }) => {
    // Navigate to Moments tab
    await page.getByRole('button', { name: 'Moments' }).click();
    await page.waitForLoadState('networkidle');

    // The button should be disabled when there's no content
    await expect(page.getByRole('button', { name: 'Capture Moment' })).toBeDisabled();
  });

  test('should display character count', async ({ page }) => {
    // Navigate to Moments tab
    await page.getByRole('button', { name: 'Moments' }).click();
    await page.waitForLoadState('networkidle');

    // Type some content
    const content = 'Testing character count';
    await page.getByPlaceholder("What's on your mind?").fill(content);

    // Verify character count is displayed
    await expect(page.getByText(`${content.length}/1000`)).toBeVisible();
  });

  test('should manage tags correctly', async ({ page }) => {
    // Navigate to Moments tab
    await page.getByRole('button', { name: 'Moments' }).click();
    await page.waitForLoadState('networkidle');

    // Add content
    await page.getByPlaceholder("What's on your mind?").fill('Testing tags');

    // Add multiple tags
    await page.getByPlaceholder('Add tags (press Enter)').fill('tag1');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder('Add tags (press Enter)').fill('tag2');
    await page.keyboard.press('Enter');

    // Remove a tag
    await page.locator('button[aria-label="Remove tag"]').first().click();

    // Submit
    await page.getByRole('button', { name: 'Capture Moment' }).click();

    // Verify only the remaining tag is shown
    await expect(page.getByText('tag2')).toBeVisible();
    await expect(page.getByText('tag1')).not.toBeVisible();
  });
});