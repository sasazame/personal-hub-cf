import { Page } from '@playwright/test';
import { TEST_USER } from './auth';
import { waitForReactHydration, waitForFormReady } from './retry-utils';
import { getTimingConfig } from './timing-config';

/**
 * Creates a unique test user for the current test
 * This prevents conflicts between tests
 */
export async function createUniqueTestUser(page: Page, browserName?: string) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const shortId = `${timestamp}${random}`.slice(-8);
  
  const uniqueUser = {
    username: `test${shortId}`,
    email: `test${shortId}@example.com`,
    password: 'Password123!'
  };
  
  try {
    await page.goto('/register');
    
    // Set English locale for i18n
    await page.evaluate(() => {
      localStorage.setItem('i18nextLng', 'en');
    });
    
    // Reload to apply language setting
    await page.reload();
    
    // Get timing config for the browser
    // Try to detect browser name from context if not provided
    const detectedBrowserName = browserName || 'chromium';
    const config = getTimingConfig(detectedBrowserName);
    
    // Wait for React hydration and form to be ready
    await waitForReactHydration(page, config.react.hydration);
    const formReady = await waitForFormReady(page, {
      formSelector: 'form',
      inputSelector: 'input[name="username"], input[type="text"]',
      timeout: config.element.visible
    });
    
    if (!formReady) {
      throw new Error('Registration form not ready after retries');
    }
    
    // Use more robust selectors - find inputs by their position and type
    const usernameInput = page.locator('input[type="text"]').first();
    const emailInput = page.locator('input[type="email"]');
    const passwordInputs = page.locator('input[type="password"]');
    
    await usernameInput.fill(uniqueUser.username);
    await emailInput.fill(uniqueUser.email);
    await passwordInputs.first().fill(uniqueUser.password);
    await passwordInputs.nth(1).fill(uniqueUser.password);
    
    // Submit with robust selector
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Register"), button:has-text("Create account")').first();
    await submitButton.click();
    
    // Wait for registration to complete - be more flexible with URL
    await page.waitForFunction(() => !window.location.pathname.includes('/register'), { timeout: 10000 });
    
    // Wait for page to stabilize properly
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    
    // Don't try to logout - the tests will handle this
    // Just return the user credentials
    
    return uniqueUser;
  } catch (error) {
    console.log('Failed to create unique test user:', error);
    throw error;
  }
}

/**
 * Ensures the default TEST_USER exists in the backend
 * Only use this for tests that specifically need the TEST_USER
 */
export async function setupTestUser(page: Page, browserName?: string) {
  // Check if user already exists by trying to login
  try {
    await page.goto('/login');
    
    // Set English locale for i18n
    await page.evaluate(() => {
      localStorage.setItem('i18nextLng', 'en');
    });
    
    // Reload to apply language setting
    await page.reload();
    
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    // Submit with robust selector for login page
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")').first();
    await submitButton.click();
    
    // Wait for login to complete
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 });
    
    // Wait for page to stabilize properly
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    
    // Find and click user menu to show logout button
    const userMenu = page.locator('button').filter({ has: page.locator('.rounded-full') });
    const menuVisible = await userMenu
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    
    if (menuVisible) {
      await userMenu.click();
      // Now click logout button in dropdown
      const logoutButton = page.locator('button:has-text("Logout")');
      await logoutButton.click();
      await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 10000 });
      console.log('TEST_USER exists and is ready');
      return;
    }
  } catch (error) {
    console.log('Login attempt failed, will try registration:', error);
  }
  
  // Try to register user
  try {
    await page.goto('/register');
    
    // Set English locale for i18n
    await page.evaluate(() => {
      localStorage.setItem('i18nextLng', 'en');
    });
    
    // Reload to apply language setting
    await page.reload();
    
    // Get timing config for the browser
    // Try to detect browser name from context if not provided
    const detectedBrowserName = browserName || 'chromium';
    const config = getTimingConfig(detectedBrowserName);
    
    // Wait for React hydration and form to be ready
    await waitForReactHydration(page, config.react.hydration);
    const formReady = await waitForFormReady(page, {
      formSelector: 'form',
      inputSelector: 'input[name="username"], input[type="text"]',
      timeout: config.element.visible
    });
    
    if (!formReady) {
      throw new Error('Registration form not ready after retries');
    }
    
    // Use more robust selectors with fallbacks
    const usernameInput = page.locator('input[type="text"], input[placeholder*="username" i], input[name="username"]').first();
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    
    // Fill with small delays to ensure React handles the input events
    await usernameInput.fill(TEST_USER.username);
    await page.waitForTimeout(100);
    await emailInput.fill(TEST_USER.email);
    await page.waitForTimeout(100);
    await passwordInput.fill(TEST_USER.password);
    await page.waitForTimeout(100);
    await confirmPasswordInput.fill(TEST_USER.password);
    await page.waitForTimeout(100);
    
    // Submit with robust selector
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Register"), button:has-text("Create account")').first();
    await submitButton.click();
    
    // Wait for registration to complete
    await page.waitForFunction(() => !window.location.pathname.includes('/register'), { timeout: 10000 });
    
    // Wait for page to stabilize properly
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    
    // Find and click user menu to show logout button
    const userMenu = page.locator('button').filter({ has: page.locator('.rounded-full') });
    const menuVisible = await userMenu
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    
    if (menuVisible) {
      await userMenu.click();
      // Now click logout button in dropdown
      const logoutButton = page.locator('button:has-text("Logout")');
      await logoutButton.click();
      await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 10000 });
    }
    
    console.log('TEST_USER created successfully');
  } catch (error) {
    console.log('User registration result:', error);
  }
}

export async function waitForApp(page: Page) {
  // Ensure i18n is initialized with English locale
  await page.evaluate(() => {
    if (!localStorage.getItem('i18nextLng')) {
      localStorage.setItem('i18nextLng', 'en');
    }
  });
  
  // Wait for DOM to be ready (recommended instead of networkidle)
  await page.waitForLoadState('domcontentloaded');
  
  // Use web assertions to check app readiness
  await page.waitForSelector('[id="__next"], #__next, body > div', { timeout: 30000 });
  
  // Wait for React hydration
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  
  // Check if we're authenticated or on auth page
  const isAuthPage = page.url().includes('/login') || page.url().includes('/register');
  
  // Wait for form elements on auth pages
  if (isAuthPage) {
    await page.waitForSelector('form', { timeout: 10000 });
  }
}