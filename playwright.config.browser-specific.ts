import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 120000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    locale: 'en-US',
    actionTimeout: 30000,
    navigationTimeout: 60000,
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },

  projects: [
    // Desktop Chrome with specific settings
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome-specific settings
        launchOptions: {
          args: ['--disable-web-security'], // For CORS issues in dev
        },
      },
    },

    // Firefox with specific handling
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-specific settings
        launchOptions: {
          firefoxUserPrefs: {
            // Disable Firefox's enhanced tracking protection which can interfere
            'privacy.trackingprotection.enabled': false,
            // Increase network timeout for Firefox
            'network.http.response.timeout': 120,
          },
        },
        // Firefox sometimes needs longer timeouts
        actionTimeout: 45000,
        navigationTimeout: 90000,
      },
    },

    // WebKit/Safari with specific handling
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // Safari-specific settings
        launchOptions: {
          args: ['--disable-web-security'],
        },
        // Safari often needs different wait strategies
        actionTimeout: 45000,
        navigationTimeout: 90000,
      },
    },

    // Mobile Chrome with touch events
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        // Mobile-specific viewport
        hasTouch: true,
        isMobile: true,
      },
    },

    // Mobile Safari with iOS-specific handling
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        // iOS-specific settings
        hasTouch: true,
        isMobile: true,
        // iOS Safari needs longer timeouts
        actionTimeout: 60000,
        navigationTimeout: 120000,
      },
    },

    // Edge browser
    {
      name: 'Microsoft Edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
    },
  ],

  // Browser-specific web server configuration
  webServer: process.env.SKIP_WEBSERVER ? undefined : [
    {
      command: 'cd apps/backend && pnpm dev',
      url: 'http://localhost:8787/health',
      reuseExistingServer: !process.env.CI,
      timeout: 180 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'cd apps/frontend && pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 180 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});