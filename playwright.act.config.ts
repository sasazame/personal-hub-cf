import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration for running tests with act (no webServer)
 * This config is used when running tests in Docker via act
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'ci.spec.ts',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  workers: 1,
  reporter: 'list',
  use: {
    actionTimeout: 0,
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Don't start webServer - it's handled by the workflow */
  webServer: undefined,

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        /* Disable sandbox for Docker environment */
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        },
      },
    },
  ],
});