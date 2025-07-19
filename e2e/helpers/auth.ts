import type { Page } from '@playwright/test';
import { TEST_USER } from '../fixtures/base-test';

export async function login(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

export async function logout(page: Page) {
  // Click on the logout button (adjust selector as needed)
  await page.click('button:has-text("Logout")');
  await page.waitForURL('/login');
}

export async function ensureLoggedOut(page: Page) {
  // Clear all cookies and storage
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/');
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
  // Navigate to todos tab
  await page.click('button:has-text("Todos")');
  
  // Wait for todos tab to be active
  await page.waitForSelector('[data-testid^="todo-delete-"]', { 
    timeout: 5000, 
    state: 'attached' 
  }).catch(() => {
    // No todos present, nothing to clear
    return;
  });
  
  // Delete all todos
  const maxAttempts = 50; // Prevent infinite loops
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const deleteButtons = page.locator('[data-testid^="todo-delete-"]');
    const count = await deleteButtons.count();
    
    if (count === 0) break;
    
    const initialCount = count;
    // Click the first delete button
    await deleteButtons.first().click();
    
    // Wait for the todo to actually be removed from DOM
    await page.waitForFunction(
      (prevCount) => document.querySelectorAll('[data-testid^="todo-delete-"]').length < prevCount,
      initialCount,
      { timeout: 2000 }
    ).catch(() => {
      // If waitForFunction times out, continue anyway
    });
    
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error(`Failed to clear all todos after ${maxAttempts} attempts`);
  }
}