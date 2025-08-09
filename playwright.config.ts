import { defineConfig, devices } from '@playwright/test';
import os from 'os';

export default defineConfig({
  testDir: './e2e',
  // Reduced timeout to 30 seconds for faster feedback
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Optimize worker count based on environment
  workers: process.env.CI ? 2 : Math.min(4, os.cpus().length), 
  reporter: process.env.CI ? 'dot' : 'html',
  // Global setup with improved error handling and retry logic to prevent EPIPE errors
  globalSetup: require.resolve('./playwright/global-setup.ts'),
  use: {
    // Point to frontend URL for E2E tests
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'off' : 'retain-on-failure', // Disable video in CI for performance
    locale: 'en-US',
    // Optimized timeouts for better performance
    actionTimeout: 10000,
    navigationTimeout: 20000,
    // Extra HTTP headers for API calls
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    // Better viewport for consistency
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Disable GPU and sandbox for better stability
        launchOptions: {
          args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox']
        }
      },
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