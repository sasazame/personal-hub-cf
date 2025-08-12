import { Page } from '@playwright/test';
import { waitForReactHydration, waitForFormReady, fillWithRetry, clickWithRetry } from './retry-utils';

/**
 * Login helper with better error detection and handling
 */
export async function login(page: Page, email: string, password: string) {
  // Navigate to login page if not already there
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Set English locale in localStorage for i18n
    await page.evaluate(() => {
      localStorage.setItem('i18nextLng', 'en');
    });
    
    // Reload to apply language setting
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
  
  // Wait for React hydration and form to be ready
  await waitForReactHydration(page);
  const formReady = await waitForFormReady(page, {
    formSelector: 'form',
    inputSelector: 'input[type="email"], input[name="email"]',
    maxRetries: 2,
    timeout: 5000
  });
  if (!formReady) {
    console.warn('Login form not ready after retries, attempting to continue anyway');
    // Don't throw, try to continue with the login attempt
  }
  
  // Fill in login form with retry logic
  await fillWithRetry(page, 'input[type="email"], input[name="email"]', email);
  await fillWithRetry(page, 'input[type="password"], input[name="password"]', password);
  
  // Find submit button with fallback selectors
  const submitButton = page.locator('button[type="submit"]').or(
    page.getByRole('button', { name: /sign in|log in|login/i })
  );
  
  if (await submitButton.count() === 0) {
    throw new Error('No submit button found on login form');
  }
  
  // Submit form by clicking the first matched button
  await submitButton.first().click();
  
  // Wait for either redirect or error message with longer timeout
  await Promise.race([
    // Wait for successful redirect
    page.waitForURL((url) => !url.href.includes('/login'), { timeout: 15000 }),
    // Or wait for error message
    page.waitForSelector('[data-sonner-toast][data-type="error"], .text-red-500, .text-red-600', { timeout: 15000 }).then(() => {
      throw new Error('Login error detected');
    })
  ]).catch(async () => {
    // Handle errors
    const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
    const hasErrorToast = await errorToast
      .waitFor({ state: 'visible', timeout: 2000 })
      .then(() => true)
      .catch(() => false);
    
    if (hasErrorToast) {
      const errorText = await errorToast.textContent();
      console.log('Login error toast:', errorText);
      throw new Error(`Login failed: ${errorText}`);
    }
    
    // Check for form validation errors
    const formErrors = page.locator('.text-red-500, .text-red-600, .text-red-700');
    const errorCount = await formErrors.count();
    
    if (errorCount > 0) {
      const errorTexts = [];
      for (let i = 0; i < Math.min(errorCount, 3); i++) {
        const errorText = await formErrors.nth(i).textContent();
        if (errorText?.trim()) {
          errorTexts.push(errorText.trim());
        }
      }
      
      if (errorTexts.length > 0) {
        console.log('Login form errors:', errorTexts);
        throw new Error(`Login failed: ${errorTexts.join(', ')}`);
      }
    }
    
    // If still on login page, something went wrong
    if (page.url().includes('/login')) {
      console.log('Still on login page after attempt. URL:', page.url());
      
      // In CI environment, don't check backend directly
      if (process.env.CI) {
        throw new Error('Login failed - check test user credentials');
      }
      
      // Only check backend in non-CI environments
      try {
        const response = await page.request.post('http://localhost:8787/api/v1/auth/login', {
          data: { email, password }
        });
        
        if (!response.ok()) {
          throw new Error(`Backend authentication failed with status ${response.status()}`);
        }
      } catch (backendError) {
        console.log('Backend direct check failed:', backendError);
        throw new Error('Make sure the backend is running at http://localhost:8787');
      }
      
      throw new Error('Login did not redirect from login page');
    }
  });
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
  try {
    // Clear all storage first before navigation
    await page.evaluate(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
        localStorage.setItem('i18nextLng', 'en');
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    }).catch(() => {
      // Ignore errors if page is not ready yet
    });
    
    // Navigate to login page with error handling for redirects
    try {
      await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 10000 });
    } catch (navError) {
      // If navigation was interrupted, check where we ended up
      const currentUrl = page.url();
      console.log('Navigation interrupted, current URL:', currentUrl);
      
      // If we're already on login page, that's fine
      if (!currentUrl.includes('/login')) {
        // Try navigating again more forcefully
        await page.goto('/login', { waitUntil: 'commit', timeout: 5000 }).catch(() => {});
      }
    }
    
    // Wait for the page to stabilize
    await page.waitForTimeout(1000); // Give i18n and React time to initialize
    
    // Check if we're on the login page
    const finalUrl = page.url();
    if (!finalUrl.includes('/login')) {
      console.log('Not on login page, attempting redirect');
      await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 5000 });
    }
    
    // Wait for React hydration and form to be ready
    await waitForReactHydration(page);
    
    // Ensure login form is ready with reduced retries to avoid context issues
    const formReady = await waitForFormReady(page, {
      formSelector: 'form',
      inputSelector: 'input[type="email"], input[name="email"]',
      maxRetries: 2  // Reduce retries to avoid context closing
    });
    
    if (!formReady) {
      console.warn('Login form not ready after retries, continuing anyway');
    }
  } catch (error) {
    console.error('Error in ensureLoggedOut:', error);
    // Don't throw, just log and continue
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