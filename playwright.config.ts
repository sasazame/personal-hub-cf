import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // Reduced timeout to 30 seconds for faster feedback
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 8, 
  reporter: 'html',
  globalSetup: require.resolve('./playwright/global-setup.ts'),
  use: {
    // Point to frontend URL for E2E tests
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    locale: 'en-US',
    // Reduced action timeout to 10 seconds (user operations should complete within 5 seconds)
    actionTimeout: 10000,
    // Reduced navigation timeout to 15 seconds
    navigationTimeout: 15000,
    // Extra HTTP headers for API calls
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Temporarily disabled for stability - can be re-enabled when needed
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // // Mobile testing
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  webServer: process.env.SKIP_WEBSERVER ? undefined : [
    // Cloudflare Workers backend
    {
      command: 'cd apps/backend && pnpm dev',
      url: 'http://localhost:8787/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    // Frontend (Vite + React)
    {
      command: 'cd apps/frontend && pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});