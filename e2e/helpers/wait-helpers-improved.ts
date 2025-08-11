import { Page } from '@playwright/test';
import { getTimingConfig, logTiming } from './timing-config';
import { waitForNavigation, waitForApiResponse, waitForReactHydration } from './retry-utils';

/**
 * Improved wait helpers with adaptive timing strategies
 */

/**
 * Navigate to a protected route with automatic login redirect handling
 */
export async function navigateToProtectedRoute(
  page: Page,
  route: string,
  options: {
    expectRedirect?: boolean;
    browserName?: string;
  } = {}
) {
  const config = getTimingConfig(options.browserName);
  const startTime = Date.now();
  
  try {
    // Navigate to the route
    await page.goto(route, {
      waitUntil: config.navigation.waitUntil,
      timeout: config.navigation.timeout
    });
    
    // If expecting redirect, wait for it
    if (options.expectRedirect !== false) {
      // Check if we were redirected to login
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        logTiming(`navigateToProtectedRoute redirected to login`, startTime, true);
        return { redirected: true, finalUrl: currentUrl };
      }
    }
    
    // Wait for React to hydrate on the target page
    await waitForReactHydration(page, config.react.hydration);
    
    logTiming(`navigateToProtectedRoute to ${route}`, startTime, true);
    return { redirected: false, finalUrl: page.url() };
  } catch (error) {
    logTiming(`navigateToProtectedRoute to ${route}`, startTime, false);
    throw error;
  }
}

/**
 * Wait for authentication state to be established
 */
export async function waitForAuthState(
  page: Page,
  expectedState: 'authenticated' | 'unauthenticated',
  options: {
    timeout?: number;
    browserName?: string;
  } = {}
) {
  const config = getTimingConfig(options.browserName);
  const timeout = options.timeout || config.react.stateUpdate;
  const startTime = Date.now();
  
  try {
    await page.waitForFunction(
      (state) => {
        // Check localStorage for auth token
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const hasToken = !!token;
        
        // Check for user menu (authenticated indicator)
        const userMenu = document.querySelector('[data-testid="user-menu"], .user-menu, button[aria-label*="user" i]');
        const hasUserMenu = !!userMenu;
        
        // Check for login/register links (unauthenticated indicators)
        const loginLink = document.querySelector('a[href="/login"]');
        const hasLoginTextButton = Array.from(document.querySelectorAll('button')).some(
          (b) => b.textContent?.trim().toLowerCase().includes('login')
        );
        const hasLoginLink = !!loginLink || hasLoginTextButton;
        
        if (state === 'authenticated') {
          return hasToken || hasUserMenu;
        } else {
          return !hasToken && (hasLoginLink || window.location.pathname.includes('/login'));
        }
      },
      expectedState,
      { timeout }
    );
    
    logTiming(`waitForAuthState: ${expectedState}`, startTime, true);
    return true;
  } catch (error) {
    logTiming(`waitForAuthState: ${expectedState}`, startTime, false);
    throw error;
  }
}

/**
 * Wait for form submission with response handling
 */
export async function waitForFormSubmission(
  page: Page,
  options: {
    apiEndpoint?: string | RegExp;
    expectedStatus?: number;
    expectedRedirect?: string | RegExp;
    timeout?: number;
    browserName?: string;
  } = {}
) {
  const config = getTimingConfig(options.browserName);
  const startTime = Date.now();
  
  try {
    const promises: Promise<any>[] = [];
    
    // Wait for API response if endpoint specified
    if (options.apiEndpoint) {
      promises.push(
        waitForApiResponse(page, options.apiEndpoint, {
          expectedStatus: options.expectedStatus,
          timeout: options.timeout || config.network.response,
          browserName: options.browserName
        })
      );
    }
    
    // Wait for navigation if redirect expected
    if (options.expectedRedirect) {
      promises.push(
        waitForNavigation(page, options.expectedRedirect, {
          timeout: options.timeout || config.navigation.timeout,
          browserName: options.browserName
        })
      );
    }
    
    // Wait for all conditions
    if (promises.length > 0) {
      await Promise.all(promises);
    }
    
    // Wait for UI to stabilize after submission
    await page.waitForLoadState('networkidle', { timeout: config.network.idle });
    
    logTiming('waitForFormSubmission', startTime, true);
    return true;
  } catch (error) {
    logTiming('waitForFormSubmission', startTime, false);
    throw error;
  }
}

/**
 * Wait for toast notification or alert
 */
export async function waitForNotification(
  page: Page,
  options: {
    text?: string | RegExp;
    type?: 'success' | 'error' | 'warning' | 'info';
    timeout?: number;
    browserName?: string;
  } = {}
) {
  const config = getTimingConfig(options.browserName);
  const timeout = options.timeout || config.element.visible;
  const startTime = Date.now();
  
  try {
    // Common notification selectors
    const selectors = [
      '[role="alert"]',
      '.toast, .notification, .alert',
      '[data-testid="notification"]',
      '.Toastify__toast',
      '.ant-message',
      '.MuiAlert-root'
    ];
    
    if (options.type) {
      selectors.push(`.${options.type}, .alert-${options.type}, .toast-${options.type}`);
    }
    
    // Wait for any notification to appear
    const notification = await page.waitForSelector(
      selectors.join(', '),
      { state: 'visible', timeout }
    );
    
    // Check text if specified
    if (options.text && notification) {
      const text = await notification.textContent();
      if (typeof options.text === 'string') {
        if (!text?.includes(options.text)) {
          throw new Error(`Notification text "${text}" does not contain "${options.text}"`);
        }
      } else {
        if (!options.text.test(text || '')) {
          throw new Error(`Notification text "${text}" does not match pattern`);
        }
      }
    }
    
    logTiming('waitForNotification', startTime, true);
    return notification;
  } catch (error) {
    logTiming('waitForNotification', startTime, false);
    throw error;
  }
}

/**
 * Wait for data to load (tables, lists, etc.)
 */
export async function waitForDataLoad(
  page: Page,
  options: {
    selector?: string;
    minItems?: number;
    timeout?: number;
    browserName?: string;
  } = {}
) {
  const config = getTimingConfig(options.browserName);
  const {
    selector = '[data-testid="data-row"], tbody tr, .list-item, li',
    minItems = 1,
    timeout = config.network.response
  } = options;
  const startTime = Date.now();
  
  try {
    // Wait for loading indicators to disappear
    await page.waitForSelector('.loading, .skeleton, [aria-busy="true"]', {
      state: 'hidden',
      timeout: timeout / 2
    }).catch(() => {}); // Ignore if no loading indicator
    
    // Wait for data items to appear
    await page.waitForFunction(
      ({ sel, min }) => {
        const items = document.querySelectorAll(sel);
        return items.length >= min;
      },
      { sel: selector, min: minItems },
      { timeout }
    );
    
    // Wait for network to settle
    await page.waitForLoadState('networkidle', { timeout: config.network.idle });
    
    logTiming('waitForDataLoad', startTime, true);
    return true;
  } catch (error) {
    logTiming('waitForDataLoad', startTime, false);
    throw error;
  }
}

/**
 * Wait for modal or dialog to appear/disappear
 */
export async function waitForModal(
  page: Page,
  action: 'open' | 'close',
  options: {
    selector?: string;
    timeout?: number;
    browserName?: string;
  } = {}
) {
  const config = getTimingConfig(options.browserName);
  const {
    selector = '[role="dialog"], .modal, .dialog, [data-testid="modal"]',
    timeout = config.element.visible
  } = options;
  const startTime = Date.now();
  
  try {
    if (action === 'open') {
      const modal = await page.waitForSelector(selector, {
        state: 'visible',
        timeout
      });
      
      // Wait for modal animation to complete
      await page.waitForTimeout(config.react.renderCycle);
      
      logTiming('waitForModal: open', startTime, true);
      return modal;
    } else {
      await page.waitForSelector(selector, {
        state: 'hidden',
        timeout
      });
      
      // Wait for backdrop to disappear
      await page.waitForSelector('.modal-backdrop, .overlay', {
        state: 'hidden',
        timeout: 2000
      }).catch(() => {});
      
      logTiming('waitForModal: close', startTime, true);
      return true;
    }
  } catch (error) {
    logTiming(`waitForModal: ${action}`, startTime, false);
    throw error;
  }
}

/**
 * Batch wait for multiple conditions
 */
export async function waitForConditions(
  page: Page,
  conditions: Array<{
    type: 'selector' | 'navigation' | 'response' | 'function';
    target: any;
    options?: any;
  }>,
  options: {
    waitAll?: boolean;
    timeout?: number;
    browserName?: string;
  } = {}
) {
  const config = getTimingConfig(options.browserName);
  const { waitAll = true, timeout = config.navigation.timeout } = options;
  const startTime = Date.now();
  
  try {
    const promises = conditions.map(condition => {
      switch (condition.type) {
        case 'selector':
          return page.waitForSelector(condition.target, {
            ...condition.options,
            timeout
          });
        case 'navigation':
          return waitForNavigation(page, condition.target, {
            ...condition.options,
            timeout,
            browserName: options.browserName
          });
        case 'response':
          return waitForApiResponse(page, condition.target, {
            ...condition.options,
            timeout,
            browserName: options.browserName
          });
        case 'function':
          return page.waitForFunction(condition.target, condition.options, { timeout });
        default:
          throw new Error(`Unknown condition type: ${condition.type}`);
      }
    });
    
    const result = waitAll 
      ? await Promise.all(promises)
      : await Promise.race(promises);
    
    logTiming(`waitForConditions (${conditions.length} conditions)`, startTime, true);
    return result;
  } catch (error) {
    logTiming(`waitForConditions failed`, startTime, false);
    throw error;
  }
}