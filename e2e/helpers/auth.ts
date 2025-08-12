import { Page } from '@playwright/test';

/**
 * Simplified login helper with minimal retry logic
 */
export async function login(page: Page, email: string, password: string) {
  // Navigate to login page if not already there
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    await page.goto('/login', { waitUntil: 'networkidle' });
  }
  
  // Wait for login form to be visible
  await page.waitForSelector('form', { state: 'visible', timeout: 5000 });
  
  // Fill in login form using Playwright's built-in robust methods
  await page.locator('input[type="email"], input[name="email"]').fill(email);
  await page.locator('input[type="password"], input[name="password"]').fill(password);
  
  // Submit form
  await page.locator('button[type="submit"]').click();
  
  // Wait for navigation away from login page
  await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
}

export async function logout(page: Page) {
  // First click the user menu dropdown
  const userMenu = page.locator('button').filter({ has: page.locator('.rounded-full') });
  const menuVisible = await userMenu
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  
  if (menuVisible) {
    await userMenu.click();
    // Wait for dropdown to open
    await page.waitForTimeout(500);
    
    // Click the last button in the dropdown (logout is always last)
    const dropdownButtons = page.locator('button').filter({ hasText: /.+/ });
    const lastButton = dropdownButtons.last();
    await lastButton.click();
    
    // Wait for redirect to login
    await page.waitForURL(/.*\/login/, { timeout: 10000 });
  }
}

/**
 * Ensures user is logged out and clears all authentication state
 */
export async function ensureLoggedOut(page: Page) {
  // Navigate to a valid page first to ensure context
  try {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 10000 });
  } catch {
    // If navigation fails, continue anyway
  }
  
  // Clear all storage - wrap in try-catch for security errors
  try {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (error) {
    // Log but don't fail if storage clearing fails
    console.log('Warning: Could not clear storage:', error);
  }
  
  // Ensure we're on login page
  if (!page.url().includes('/login')) {
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 10000 });
  }
}

// Test user credentials
export const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123!',  // Updated to match backend requirements: 8+ chars, uppercase, lowercase, digit, special char
  username: 'testuser'
};


// Alternative test user for multi-user scenarios
export const TEST_USER_2 = {
  email: 'test2@example.com',
  password: 'Password123!',  // Updated to match backend requirements: 8+ chars, uppercase, lowercase, digit, special char
  username: 'testuser2'
};