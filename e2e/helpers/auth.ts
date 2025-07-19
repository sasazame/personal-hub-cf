import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { TEST_USER } from '../fixtures/base-test';

export async function login(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Wait for the login response to complete
  const responsePromise = page.waitForResponse(response => 
    response.url().includes('/auth/login') && response.request().method() === 'POST'
  );
  
  await page.click('button[type="submit"]');
  const response = await responsePromise;
  
  if (response.status() !== 200) {
    throw new Error(`Login failed with status ${response.status()}`);
  }
  
  // Give the frontend time to process the auth state
  await page.waitForTimeout(1000);
  
  // Force navigation to home page
  await page.goto('/');
  
  // Verify we're authenticated
  await page.waitForSelector('button:has-text("Logout")', { timeout: 5000 });
}

export async function logout(page: Page) {
  // Click on the logout button (adjust selector as needed)
  await page.click('button:has-text("Logout")');
  await page.waitForURL('/login');
}

export async function ensureLoggedOut(page: Page) {
  // Clear all cookies and storage
  await page.context().clearCookies();
  
  // Navigate to the app first to ensure we're on the right origin
  await page.goto('/');
  
  // Then clear storage
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (error) {
    // If storage is not accessible, that's ok - cookies are cleared
    console.log('Could not clear storage:', error);
  }
}

export async function registerNewUser(page: Page, email: string, password: string, username?: string) {
  await ensureLoggedOut(page);
  await page.goto('/register');
  
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  if (username) {
    await page.fill('input[name="username"]', username);
  }
  
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check if we're on a protected page
  const url = page.url();
  if (url.includes('/login') || url.includes('/register')) {
    return false;
  }
  
  // Check for presence of logout button or user info
  const logoutButton = await page.locator('button:has-text("Logout")').count();
  return logoutButton > 0;
}

export async function clearAllTodos(page: Page) {
  // Navigate to ensure we're on the todos page
  await page.goto('/');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Get initial count
  let todoCount = await page.locator('[data-testid^="todo-item-"]').count();
  
  // Delete todos one by one
  for (let i = 0; i < todoCount; i++) {
    // Always delete the first remaining item
    const deleteButtons = page.locator('[data-testid^="todo-delete-"]');
    const currentCount = await deleteButtons.count();
    
    if (currentCount === 0) break;
    
    // Click the first delete button
    await deleteButtons.first().click();
    
    // Wait a bit for the deletion to process
    await page.waitForTimeout(500);
  }
  
  // Wait for all todos to be gone
  await page.waitForFunction(() => {
    const items = document.querySelectorAll('[data-testid^="todo-item-"]');
    return items.length === 0;
  }, { timeout: 10000 }).catch(() => {
    // If timeout, that's ok - maybe there were no todos
  });
}