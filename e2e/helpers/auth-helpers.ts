import { Page } from '@playwright/test';

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
  await page.waitForTimeout(2000); // Give React time to hydrate
  
  // Wait for form to be ready
  await page.waitForSelector('form', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('input[name="username"]', { state: 'visible', timeout: 15000 });
  
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard or login
  await Promise.race([
    page.waitForURL('**/dashboard', { timeout: 5000 }),
    page.waitForURL('**/login**', { timeout: 5000 })
  ]);
  
  // If on login page, login
  if (page.url().includes('/login')) {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Give React time to hydrate
    await page.waitForSelector('form', { state: 'visible', timeout: 10000 });
    
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  }
  
  return { username, email, password };
}