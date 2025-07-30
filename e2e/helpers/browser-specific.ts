import { Page, BrowserContext } from '@playwright/test';

/**
 * Browser-specific helper functions
 */
export const browserHelpers = {
  /**
   * Handle browser-specific navigation quirks
   */
  async navigateWithBrowserHandling(page: Page, url: string, browserName: string) {
    if (browserName === 'firefox') {
      // Firefox sometimes needs a pre-navigation to establish connection
      try {
        await page.goto('about:blank');
        await page.waitForTimeout(500);
      } catch {
        // Ignore errors on about:blank
      }
    }

    await page.goto(url);

    if (browserName === 'webkit') {
      // Safari sometimes needs extra time for JavaScript to initialize
      await page.waitForTimeout(1000);
    }

    await page.waitForLoadState('networkidle');
  },

  /**
   * Handle browser-specific form interactions
   */
  async fillFormField(page: Page, selector: string, value: string, browserName: string) {
    const field = page.locator(selector);
    
    if (browserName === 'webkit') {
      // Safari sometimes needs click before fill
      await field.click();
      await page.waitForTimeout(100);
    }

    await field.fill(value);

    if (browserName === 'firefox') {
      // Firefox sometimes needs blur event to trigger validation
      await page.keyboard.press('Tab');
    }
  },

  /**
   * Handle browser-specific wait strategies
   */
  async waitForElement(page: Page, selector: string, browserName: string) {
    const timeouts = {
      chromium: 5000,
      firefox: 10000,  // Firefox needs longer timeouts
      webkit: 15000,   // Safari needs even longer
    };

    const timeout = timeouts[browserName as keyof typeof timeouts] || 10000;
    
    await page.locator(selector).waitFor({ 
      state: 'visible',
      timeout 
    });
  },

  /**
   * Handle mobile-specific interactions
   */
  async handleMobileInteraction(page: Page, isMobile: boolean) {
    if (!isMobile) return;

    // Mobile devices might need viewport adjustments
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      // Handle mobile menu, etc.
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
      }
    }
  },

  /**
   * Browser-specific cookie handling
   */
  async setupBrowserCookies(context: BrowserContext, browserName: string) {
    if (browserName === 'webkit') {
      // Safari has stricter cookie policies
      await context.addCookies([{
        name: 'test-mode',
        value: 'true',
        domain: 'localhost',
        path: '/',
        sameSite: 'None',
        secure: false,
      }]);
    }
  },

  /**
   * Handle browser-specific console errors
   */
  setupConsoleHandling(page: Page, browserName: string) {
    page.on('console', (msg) => {
      // Firefox logs more verbose warnings that can be ignored
      if (browserName === 'firefox' && msg.type() === 'warning') {
        return;
      }
      
      // Log errors for debugging
      if (msg.type() === 'error') {
        console.log(`[${browserName}] Console error:`, msg.text());
      }
    });
  },

  /**
   * Get browser-specific selectors
   */
  getSelector(baseSelector: string, browserName: string): string {
    const browserSelectors: Record<string, Record<string, string>> = {
      // Safari might need different selectors for some elements
      webkit: {
        'input[type="date"]': 'input[type="text"][data-date-input]',
      },
    };

    return browserSelectors[browserName]?.[baseSelector] || baseSelector;
  }
};