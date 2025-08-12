import { Page } from '@playwright/test';
import { getTimingConfig, logTiming } from './timing-config';

/**
 * Simple retry helper
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
      console.log(`Attempt ${i + 1} failed:`, error);
    }
    
    if (i < maxRetries - 1 && !page.isClosed()) {
      console.log(`Retry ${i + 1}: ${message}`);
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForTimeout(reloadDelay);
    }
  }
  
  return false;
}

/**
 * Simple wait for page to be ready
 */
export async function waitForReactHydration(page: Page, timeout = 5000) {
  // Just wait for network to be idle - Playwright handles this well
  await page.waitForLoadState('networkidle', { timeout });
  return true;
}

/**
 * Simple wait for form to be ready
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
    timeout = 5000
  } = options;
  
  // Simple wait for form visibility
  await page.waitForSelector(formSelector, { state: 'visible', timeout });
  return true;
}

/**
 * Simple click - let Playwright handle retries
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
  // Use Playwright's built-in retry mechanism
  const element = page.locator(selector).first();
  await element.click({ force: options.force });
  return true;
}

/**
 * Simple form fill - let Playwright handle retries
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
  // Use Playwright's built-in retry mechanism
  const element = page.locator(selector).first();
  await element.fill(value);
  return true;
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