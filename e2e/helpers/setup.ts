import { Page } from '@playwright/test';
import { TEST_USER } from './auth';

/**
 * Creates a unique test user for the current test
 * This prevents conflicts between tests
 */
export async function createUniqueTestUser(page: Page) {
  const timestamp = Date.now();
  const uniqueUser = {
    username: `test${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'Password123!'
  };
  
  await page.goto('/register', { waitUntil: 'networkidle' });
  
  // Fill registration form
  await page.locator('input[name="username"], input[type="text"]').first().fill(uniqueUser.username);
  await page.locator('input[type="email"]').fill(uniqueUser.email);
  const passwordInputs = page.locator('input[type="password"]');
  await passwordInputs.first().fill(uniqueUser.password);
  await passwordInputs.nth(1).fill(uniqueUser.password);
  
  // Submit form
  await page.locator('button[type="submit"]').click();
  
  // Wait for registration to complete
  await page.waitForURL((url) => !url.href.includes('/register'), { timeout: 10000 });
  
  return uniqueUser;
}

/**
 * Ensures the default TEST_USER exists in the backend
 * Only use this for tests that specifically need the TEST_USER
 */
export async function setupTestUser(page: Page) {
  // Try to login first to check if user exists
  try {
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    
    // Wait for navigation
    await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 5000 });
    
    // User exists, logout
    await page.goto('/login', { waitUntil: 'networkidle' });
    return;
  } catch {
    // User doesn't exist, continue to registration
  }
  
  // Register the test user
  await page.goto('/register', { waitUntil: 'networkidle' });
  
  // Fill registration form
  await page.locator('input[name="username"], input[type="text"]').first().fill(TEST_USER.username);
  await page.locator('input[type="email"]').fill(TEST_USER.email);
  const passwordInputs = page.locator('input[type="password"]');
  await passwordInputs.first().fill(TEST_USER.password);
  await passwordInputs.nth(1).fill(TEST_USER.password);
  
  // Submit form
  await page.locator('button[type="submit"]').click();
  
  // Wait for registration to complete and navigate away from register page
  await page.waitForURL((url) => !url.href.includes('/register'), { timeout: 10000 });
  
  // Wait for any post-registration redirects to complete
  await page.waitForLoadState('networkidle', { timeout: 5000 });
  
  // Navigate to login page to ensure clean state
  await page.goto('/login', { waitUntil: 'networkidle' });
}

export async function waitForApp(page: Page) {
  // Wait for app to be ready
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  
  // Ensure React root is present and hydrated
  await page.waitForSelector('#root, #app, [data-reactroot]', { 
    state: 'attached', 
    timeout: 5000 
  }).catch(() => {
    // If no React root found, continue anyway (app might use different structure)
  });
  
  return true;
}