/**
 * Performance utilities for E2E tests
 * Provides helpers to optimize test execution speed
 */

import { Page, BrowserContext } from '@playwright/test';

/**
 * Disable animations and transitions for faster test execution
 */
export async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  });
}

/**
 * Block unnecessary resources to speed up page loads
 */
export async function blockUnnecessaryResources(context: BrowserContext) {
  await context.route('**/*.{png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf}', route => {
    // Block images and fonts in CI
    if (process.env.CI) {
      route.abort();
    } else {
      route.continue();
    }
  });

  // Block analytics and tracking scripts
  await context.route('**/analytics/**', route => route.abort());
  await context.route('**/gtag/**', route => route.abort());
  await context.route('**/google-analytics/**', route => route.abort());
  await context.route('**/plausible/**', route => route.abort());
  await context.route('**/segment/**', route => route.abort());
}

/**
 * Fast page navigation with minimal waiting
 */
export async function fastGoto(page: Page, url: string) {
  await page.goto(url, {
    waitUntil: 'domcontentloaded', // Don't wait for all resources
    timeout: 10000
  });
}

/**
 * Efficient element waiting with early exit
 */
export async function waitForElementOptimized(
  page: Page,
  selector: string,
  options: { timeout?: number; state?: 'visible' | 'attached' | 'hidden' | 'detached' } = {}
) {
  const { timeout = 5000, state = 'visible' } = options;
  
  try {
    await page.waitForSelector(selector, { timeout, state });
    return true;
  } catch {
    return false;
  }
}

/**
 * Batch multiple actions for efficiency
 */
export async function batchFillForm(
  page: Page,
  formData: Record<string, string>
) {
  const promises = Object.entries(formData).map(([selector, value]) =>
    page.fill(selector, value)
  );
  await Promise.all(promises);
}

/**
 * Smart wait that exits early when condition is met
 */
export async function waitForCondition(
  page: Page,
  condition: () => Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
) {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await page.waitForTimeout(interval);
  }
  
  return false;
}

/**
 * Parallel test data setup
 */
export async function setupTestDataInParallel(
  page: Page,
  setupFunctions: Array<() => Promise<void>>
) {
  await Promise.all(setupFunctions.map(fn => fn()));
}

/**
 * Cache authentication state for reuse
 */
export async function cacheAuthState(
  context: BrowserContext,
  storageStatePath: string
) {
  await context.storageState({ path: storageStatePath });
}

/**
 * Load cached authentication state
 */
export async function loadAuthState(
  browser: any,
  storageStatePath: string
) {
  return await browser.newContext({
    storageState: storageStatePath
  });
}

/**
 * Skip redundant navigation if already on the page
 */
export async function smartNavigate(page: Page, url: string) {
  const currentUrl = page.url();
  if (!currentUrl.includes(url)) {
    await fastGoto(page, url);
  }
}

/**
 * Measure and log test performance
 */
export function measurePerformance(testName: string) {
  const startTime = Date.now();
  
  return {
    end: () => {
      const duration = Date.now() - startTime;
      if (process.env.MEASURE_PERF) {
        console.log(`[PERF] ${testName}: ${duration}ms`);
      }
      return duration;
    }
  };
}

/**
 * Use test data factories for faster data generation
 */
export class TestDataFactory {
  private static counter = 0;

  static getUniqueId(): string {
    return `${Date.now()}${++this.counter}`;
  }

  static getTestUser() {
    const id = this.getUniqueId();
    return {
      username: `user${id}`,
      email: `user${id}@test.com`,
      password: 'TestPass123!'
    };
  }

  static getTestTodo() {
    const id = this.getUniqueId();
    return {
      title: `Todo ${id}`,
      description: `Description for todo ${id}`,
      priority: 'MEDIUM'
    };
  }

  static getTestNote() {
    const id = this.getUniqueId();
    return {
      title: `Note ${id}`,
      content: `Content for note ${id}`
    };
  }
}

/**
 * Retry mechanism for flaky operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: { maxRetries?: number; delay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000 } = options;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Efficient API request helper
 */
export async function apiRequest(
  page: Page,
  method: string,
  url: string,
  data?: any
) {
  return await page.evaluate(async ({ method, url, data }) => {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return {
      ok: response.ok,
      status: response.status,
      data: await response.json().catch(() => null)
    };
  }, { method, url, data });
}