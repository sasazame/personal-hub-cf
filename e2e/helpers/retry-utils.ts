import { Page } from '@playwright/test';
import { getTimingConfig, calculateBackoffDelay, logTiming, getAdaptiveTimeout } from './timing-config';

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
      try {
        // Check if page is still valid before attempting reload
        if (!page.isClosed()) {
          await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.waitForTimeout(reloadDelay);
        } else {
          console.log('Page context closed, cannot retry');
          return false;
        }
      } catch (reloadErr) {
        console.log('Reload failed, continuing retries:', reloadErr);
        // Only wait if page is still valid
        if (!page.isClosed()) {
          await page.waitForTimeout(reloadDelay);
        } else {
          return false;
        }
      }
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
          const ariaBusy = (form as HTMLElement).getAttribute('aria-busy');
          if (ariaBusy === 'true') return false;
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
 * Robust element click with retry and adaptive timing
 */
export async function clickWithRetry(
  page: Page,
  selector: string,
  options: {
    maxRetries?: number;
    timeout?: number;
    browserName?: string;
    force?: boolean;
  } = {}
) {
  const config = getTimingConfig(options.browserName);
  const { 
    maxRetries = config.retry.maxAttempts, 
    timeout = config.element.clickable,
    force = false
  } = options;
  const startTime = Date.now();
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const element = page.locator(selector).first();
      const adaptiveTimeout = getAdaptiveTimeout(timeout, i + 1);
      
      // Wait for element to be ready
      await element.waitFor({ state: 'visible', timeout: adaptiveTimeout });
      
      // Additional stability check
      await page.waitForFunction(
        (sel) => {
          const el = document.querySelector(sel) as HTMLElement;
          if (!el) return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && 
                 rect.height > 0 && 
                 !el.hasAttribute('disabled') &&
                 el.style.pointerEvents !== 'none';
        },
        selector,
        { timeout: Math.min(5000, adaptiveTimeout / 2) }
      );
      
      // Try to click with force option if needed
      await element.click({ force });
      
      logTiming(`clickWithRetry: ${selector}`, startTime, true, i + 1);
      return true;
    } catch (error) {
      if (i < maxRetries - 1) {
        const delay = calculateBackoffDelay(i + 1, config.retry);
        console.log(`Click attempt ${i + 1}/${maxRetries} failed for ${selector}, retrying in ${delay}ms...`);
        await page.waitForTimeout(delay);
        
        // Try to scroll element into view on retry
        if (i > 0) {
          try {
            await page.locator(selector).first().scrollIntoViewIfNeeded();
          } catch {
            // Ignore scroll errors - element might not be scrollable or already in view
          }
        }
      } else {
        logTiming(`clickWithRetry: ${selector}`, startTime, false, maxRetries);
        throw error;
      }
    }
  }
  
  return false;
}

/**
 * Robust form fill with retry and validation
 */
export async function fillWithRetry(
  page: Page,
  selector: string,
  value: string,
  options: {
    maxRetries?: number;
    timeout?: number;
    browserName?: string;
    clearFirst?: boolean;
  } = {}
) {
  const config = getTimingConfig(options.browserName);
  const { 
    maxRetries = config.retry.maxAttempts, 
    timeout = config.element.fillable,
    clearFirst = true
  } = options;
  const startTime = Date.now();
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const element = page.locator(selector).first();
      const adaptiveTimeout = getAdaptiveTimeout(timeout, i + 1);
      
      await element.waitFor({ state: 'visible', timeout: adaptiveTimeout });
      
      // Clear field first if needed
      if (clearFirst) {
        await element.clear();
        // Small delay after clear for some browsers
        if (options.browserName === 'webkit') {
          await page.waitForTimeout(100);
        }
      }
      
      // Fill the value
      await element.fill(value);
      
      // Trigger input event for React
      await element.dispatchEvent('input');
      
      // Small delay for value to propagate
      await page.waitForTimeout(100);
      
      // Verify the value was set
      const actualValue = await element.inputValue();
      if (actualValue === value) {
        logTiming(`fillWithRetry: ${selector}`, startTime, true, i + 1);
        return true;
      }
      
      throw new Error(`Value mismatch: expected "${value}", got "${actualValue}"`);
    } catch (error) {
      if (i < maxRetries - 1) {
        const delay = calculateBackoffDelay(i + 1, config.retry);
        console.log(`Fill attempt ${i + 1}/${maxRetries} failed for ${selector}, retrying in ${delay}ms...`);
        await page.waitForTimeout(delay);
        
        // Try clicking the field first on retry
        if (i > 0) {
          try {
            await page.locator(selector).first().click();
          } catch {
            // Ignore click errors - field might already be focused
          }
        }
      } else {
        logTiming(`fillWithRetry: ${selector}`, startTime, false, maxRetries);
        throw error;
      }
    }
  }
  
  return false;
}

/**
 * Wait for navigation with improved detection
 */
export async function waitForNavigation(
  page: Page,
  expectedUrl: string | RegExp,
  options: {
    timeout?: number;
    browserName?: string;
  } = {}
) {
  const config = getTimingConfig(options.browserName);
  const timeout = options.timeout || config.navigation.timeout;
  const startTime = Date.now();
  
  try {
    await page.waitForFunction(
      (expected) => {
        const currentUrl = window.location.href;
        if (typeof expected === 'string') {
          return currentUrl.includes(expected);
        } else {
          return new RegExp(expected.source, expected.flags).test(currentUrl);
        }
      },
      expectedUrl instanceof RegExp ? { source: expectedUrl.source, flags: expectedUrl.flags } : expectedUrl,
      { timeout }
    );
    
    // Wait for page to stabilize after navigation
    await page.waitForLoadState('networkidle', { timeout: config.network.idle }).catch(() => {});
    
    logTiming(`waitForNavigation to ${expectedUrl}`, startTime, true);
    return true;
  } catch (error) {
    logTiming(`waitForNavigation to ${expectedUrl}`, startTime, false);
    throw error;
  }
}

/**
 * Wait for API response with retry
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  options: {
    timeout?: number;
    browserName?: string;
    expectedStatus?: number;
  } = {}
) {
  const config = getTimingConfig(options.browserName);
  const timeout = options.timeout || config.network.response;
  const startTime = Date.now();
  
  try {
    const responsePromise = page.waitForResponse(
      response => {
        const matches = typeof urlPattern === 'string' 
          ? response.url().includes(urlPattern)
          : urlPattern.test(response.url());
        
        if (!matches) return false;
        
        if (options.expectedStatus !== undefined) {
          return response.status() === options.expectedStatus;
        }
        
        return response.ok();
      },
      { timeout }
    );
    
    const response = await responsePromise;
    logTiming(`waitForApiResponse: ${urlPattern}`, startTime, true);
    return response;
  } catch (error) {
    logTiming(`waitForApiResponse: ${urlPattern}`, startTime, false);
    throw error;
  }
}