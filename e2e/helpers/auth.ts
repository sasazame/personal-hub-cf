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
  await page.waitForSelector('input[type="email"], input[name="email"]', { state: 'visible', timeout: 10000 });
  
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
  // Navigate to root to ensure correct origin
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
  } catch {}

  // If currently authenticated, perform server-side logout with CSRF header
  try {
    const me = await page.evaluate(async () => {
      const res = await fetch('/api/v1/auth/me', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    });

    if (me && me.csrfToken) {
      await page.evaluate(async (token: string) => {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { 'X-CSRF-Token': token },
          credentials: 'include',
        });
      }, me.csrfToken as string);
    }
  } catch (e) {
    // best-effort
    console.warn('ensureLoggedOut: server-side logout skipped:', e);
  }

  // Clear storage and cookies regardless
  try {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      // eslint-disable-next-line no-undef
      sessionStorage.clear();
    });
  } catch (error) {
    console.log('Warning: Could not clear storage:', error);
  }

  // Ensure we land on login page
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
