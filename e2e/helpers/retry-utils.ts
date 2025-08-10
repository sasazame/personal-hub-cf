import { Page } from '@playwright/test';

/**
 * Retry a check function with page reload on failure
 */
export async function retryWithReload(
  page: Page,
  check: () => Promise<boolean>,
  options: {
    maxRetries?: number;
    reloadDelay?: number;
    message?: string;
  } = {}
) {
  const { maxRetries = 3, reloadDelay = 2000, message = 'Retrying...' } = options;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (await check()) return true;
    } catch (error) {
      // Continue to retry on error
      console.log(`Attempt ${i + 1} failed:`, error);
    }
    
    if (i < maxRetries - 1) {
      console.log(`Retry ${i + 1}: ${message}`);
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(reloadDelay);
    }
  }
  
  return false;
}

/**
 * Wait for React hydration to complete
 */
export async function waitForReactHydration(page: Page, timeout = 10000) {
  try {
    // First wait for basic DOM content
    await page.waitForLoadState('domcontentloaded');
    
    // Then wait for network to settle
    await page.waitForLoadState('networkidle', { timeout: timeout / 2 }).catch(() => {});
    
    // Check for common React hydration indicators
    await page.waitForFunction(
      () => {
        // Check if React root exists and has content
        const root = document.getElementById('root');
        if (!root || !root.children.length) return false;
        
        // Check if there are no pending React operations
        // This works for React 18+
        const hasPendingWork = document.querySelector('[data-reactroot]')?.getAttribute('data-pending');
        if (hasPendingWork === 'true') return false;
        
        // Check for common loading indicators
        const loadingElements = document.querySelectorAll('.loading, .spinner, [aria-busy="true"]');
        if (loadingElements.length > 0) return false;
        
        // Check if forms are interactive (a good sign React has hydrated)
        const forms = document.querySelectorAll('form');
        if (forms.length > 0) {
          const firstInput = document.querySelector('input:not([type="hidden"])');
          if (firstInput && firstInput instanceof HTMLInputElement) {
            // Try to check if the input is interactive
            return !firstInput.disabled && firstInput.offsetParent !== null;
          }
        }
        
        return true;
      },
      { timeout }
    );
    
    // Small additional delay for final settling
    await page.waitForTimeout(500);
    
    return true;
  } catch (error) {
    console.log('React hydration wait failed:', error);
    return false;
  }
}

/**
 * Wait for a form to be ready with retry logic
 */
export async function waitForFormReady(
  page: Page,
  options: {
    formSelector?: string;
    inputSelector?: string;
    maxRetries?: number;
    timeout?: number;
  } = {}
) {
  const {
    formSelector = 'form',
    inputSelector = 'input:not([type="hidden"])',
    maxRetries = 3,
    timeout = 10000
  } = options;
  
  return retryWithReload(
    page,
    async () => {
      try {
        // Wait for form to be visible
        await page.waitForSelector(formSelector, { state: 'visible', timeout });
        
        // Wait for at least one input to be visible
        await page.waitForSelector(inputSelector, { state: 'visible', timeout: timeout / 2 });
        
        // Check if form is interactive
        const isInteractive = await page.evaluate((selector) => {
          const form = document.querySelector(selector);
          if (!form) return false;
          
          const inputs = form.querySelectorAll('input:not([type="hidden"])');
          return inputs.length > 0 && Array.from(inputs).some(input => !input.disabled);
        }, formSelector);
        
        return isInteractive;
      } catch {
        return false;
      }
    },
    {
      maxRetries,
      message: `Waiting for ${formSelector} to be ready`
    }
  );
}

/**
 * Robust element click with retry
 */
export async function clickWithRetry(
  page: Page,
  selector: string,
  options: {
    maxRetries?: number;
    timeout?: number;
  } = {}
) {
  const { maxRetries = 3, timeout = 10000 } = options;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const element = page.locator(selector).first();
      await element.waitFor({ state: 'visible', timeout });
      await element.click();
      return true;
    } catch (error) {
      if (i < maxRetries - 1) {
        console.log(`Click attempt ${i + 1} failed for ${selector}, retrying...`);
        await page.waitForTimeout(1000);
      } else {
        throw error;
      }
    }
  }
  
  return false;
}

/**
 * Robust form fill with retry
 */
export async function fillWithRetry(
  page: Page,
  selector: string,
  value: string,
  options: {
    maxRetries?: number;
    timeout?: number;
  } = {}
) {
  const { maxRetries = 3, timeout = 10000 } = options;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const element = page.locator(selector).first();
      await element.waitFor({ state: 'visible', timeout });
      await element.fill(value);
      
      // Verify the value was set
      const actualValue = await element.inputValue();
      if (actualValue === value) {
        return true;
      }
      
      throw new Error(`Value mismatch: expected "${value}", got "${actualValue}"`);
    } catch (error) {
      if (i < maxRetries - 1) {
        console.log(`Fill attempt ${i + 1} failed for ${selector}, retrying...`);
        await page.waitForTimeout(1000);
      } else {
        throw error;
      }
    }
  }
  
  return false;
}