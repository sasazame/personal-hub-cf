import { defineConfig, devices } from '@playwright/test';

/**
 * CI-optimized Playwright configuration
 * Runs faster with reduced retries and parallel execution
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'ci.spec.ts',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: true,
  retries: 1,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    actionTimeout: 0,
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});