import type { Page } from '@playwright/test';
import { TEST_USER } from '../fixtures/base-test';

export async function setupTestUser(page: Page) {
  // This would normally interact with a test API or database
  // For now, we'll assume the test user exists
  // In a real scenario, you might want to:
  // 1. Call a test API to create the user
  // 2. Or use database commands to ensure the user exists
  console.log('Test user setup:', TEST_USER.email);
}

export async function waitForApp(page: Page) {
  // Wait for the app to be fully loaded
  // This might include waiting for:
  // - React to mount
  // - Initial data to load
  // - Authentication check to complete
  
  // Wait for the root element to be visible
  await page.waitForSelector('#root', { state: 'attached' });
  
  // Wait for any loading indicators to disappear
  await page.waitForFunction(() => !document.querySelector('[data-loading="true"]'));
}

export async function createUniqueTestUser() {
  const timestamp = Date.now();
  return {
    email: `test-${timestamp}@example.com`,
    password: 'Password123!',
    username: `testuser${timestamp}`,
  };
}