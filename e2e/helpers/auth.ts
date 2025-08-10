import { Page } from '@playwright/test';

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
  
  // Wait for the page to stabilize
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  
  // Wait for login form to be visible with multiple fallback strategies
  try {
    // Try primary selector first
    await page.waitForSelector('input[type="email"]', { timeout: 5000, state: 'visible' });
  } catch {
    // Fallback: wait for form element
    await page.waitForSelector('form', { timeout: 5000, state: 'visible' });
    // Then wait for email input with alternative selectors
    await page.waitForSelector('input[placeholder*="email" i], input[name="email"], input[type="email"]', { 
      timeout: 10000, 
      state: 'visible' 
    });
  }
  
  // Ensure form is ready for interaction
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500); // Small delay for form hydration
  
  // Fill in login form with more robust selectors
  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i], input[name="password"]').first();
  
  await emailInput.fill(email);
  await passwordInput.fill(password);
  
  // Submit form with fallback selectors
  const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")').first();
  await submitButton.click();
  
  // Wait for either redirect or error message with longer timeout
  await Promise.race([
    // Wait for successful redirect
    page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 }),
    // Or wait for error message
    page.waitForSelector('[data-sonner-toast][data-type="error"], .text-red-500, .text-red-600', { timeout: 10000 }).then(() => {
      throw new Error('Login error detected');
    })
  ]).catch(async () => {
    // Handle errors
    const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
    const hasErrorToast = await errorToast.isVisible({ timeout: 2000 }).catch(() => false);
    
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
        const response = await page.evaluate(async ([email, password]) => {
          const response = await fetch('http://localhost:8787/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          return { status: response.status, ok: response.ok };
        }, [email, password]);
        
        if (!response.ok) {
          throw new Error(`Backend authentication failed with status ${response.status}`);
        }
      } catch (backendError) {
        console.log('Backend direct check failed:', backendError);
        throw new Error('Make sure the backend is running at localhost:8787');
      }
      
      throw new Error('Login did not redirect from login page');
    }
  });
}

export async function logout(page: Page) {
  // First click the user menu dropdown
  const userMenu = page.locator('button').filter({ has: page.locator('.rounded-full') });
  const menuVisible = await userMenu.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (menuVisible) {
    await userMenu.click();
    // Wait for dropdown to open
    await page.waitForTimeout(500);
    
    // Click the last button in the dropdown (logout is always last)
    const dropdownButtons = page.locator('button').filter({ hasText: /.+/ });
    const lastButton = await dropdownButtons.last();
    await lastButton.click();
    
    // Wait for redirect to login
    await page.waitForURL(/.*\/login/, { timeout: 10000 });
  }
}

/**
 * Ensures user is logged out and clears all authentication state
 */
export async function ensureLoggedOut(page: Page) {
  // Navigate to login page first to have a page context
  await page.goto('/login', { waitUntil: 'networkidle' });
  
  // Clear all storage and set i18n language
  await page.evaluate(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
      localStorage.setItem('i18nextLng', 'en');
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });
  
  // Reload the page to ensure clean state and i18n initializes properly
  await page.reload({ waitUntil: 'networkidle' });
  
  // Wait for the page to stabilize
  await page.waitForTimeout(1000); // Give i18n and React time to initialize
  
  // Wait for login form to be ready with robust fallback strategy
  try {
    // Primary: wait for email input
    await page.waitForSelector('input[type="email"]', { timeout: 5000, state: 'visible' });
  } catch {
    try {
      // Fallback 1: wait for form and then email input
      await page.waitForSelector('form', { timeout: 5000, state: 'visible' });
      await page.waitForSelector('input[placeholder*="email" i], input[name="email"], input[type="email"]', { 
        timeout: 10000, 
        state: 'visible' 
      });
    } catch (error) {
      // Fallback 2: wait for any input and check if login page loaded
      console.log('Waiting for page to fully load...');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Give React time to hydrate
      const inputs = await page.locator('input').count();
      if (inputs === 0) {
        throw new Error('No input elements found on login page');
      }
    }
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