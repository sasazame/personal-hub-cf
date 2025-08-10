import { Page } from '@playwright/test';
import { waitForReactHydration, waitForFormReady, fillWithRetry, clickWithRetry } from './retry-utils';

/**
 * Helper function to register and login a new test user
 * @param page - Playwright Page object
 * @returns User credentials object
 */
export async function registerAndLogin(page: Page) {
  const timestamp = Date.now().toString().slice(-6);
  const username = `user${timestamp}`;
  const email = `${username}@test.com`;
  const password = 'Test123456!';
  
  // Register
  await page.goto('/register');
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for React hydration and form to be ready
  await waitForReactHydration(page);
  const formReady = await waitForFormReady(page, {
    formSelector: 'form',
    inputSelector: 'input[name="username"]'
  });
  
  if (!formReady) {
    throw new Error('Registration form not ready after retries');
  }
  
  await fillWithRetry(page, 'input[name="username"]', username);
  await fillWithRetry(page, 'input[name="email"]', email);
  await fillWithRetry(page, 'input[name="password"]', password);
  await fillWithRetry(page, 'input[name="confirmPassword"]', password);
  await clickWithRetry(page, 'button[type="submit"]');
  
  // Wait for redirect to dashboard or login
  await Promise.race([
    page.waitForURL('**/dashboard', { timeout: 5000 }),
    page.waitForURL('**/login**', { timeout: 5000 })
  ]);
  
  // If on login page, login
  if (page.url().includes('/login')) {
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for React hydration and form to be ready
    await waitForReactHydration(page);
    const loginFormReady = await waitForFormReady(page, {
      formSelector: 'form',
      inputSelector: 'input[name="email"], input[type="email"]'
    });
    
    if (!loginFormReady) {
      throw new Error('Login form not ready after retries');
    }
    
    await fillWithRetry(page, 'input[name="email"], input[type="email"]', email);
    await fillWithRetry(page, 'input[name="password"], input[type="password"]', password);
    await clickWithRetry(page, 'button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  }
  
  return { username, email, password };
}