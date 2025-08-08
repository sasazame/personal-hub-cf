import { defineConfig, devices } from '@playwright/test';

/**
 * Extended CI Playwright configuration
 * Runs critical tests from multiple spec files for better coverage
 */
export default defineConfig({
  testDir: './e2e',
  // Include critical CI tests and essential feature tests
  // Note: Excluding notes.spec.ts as it has complex UI interactions that are less critical
  testMatch: [
    'ci-comprehensive.spec.ts',  // New comprehensive test suite
    'ci-critical.spec.ts',        // Critical path tests
    'ci.spec.ts',                  // Original CI tests
    'api-health.spec.ts'           // API health checks
  ],
  timeout: 30 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: true,
  forbidOnly: true,
  retries: 1,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
  // Disable global setup in CI to avoid browser launch issues
  globalSetup: undefined,
  use: {
    actionTimeout: 0,
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Improved viewport for consistency
    viewport: { width: 1280, height: 720 },
    // Better network handling
    ignoreHTTPSErrors: true,
    // Increase navigation timeout
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Disable GPU for better CI stability
        launchOptions: {
          args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox']
        }
      },
    },
    // Keep only Chromium for CI stability
  ],

  // Disable webServer in CI since we manually start servers
  webServer: process.env.SKIP_WEBSERVER ? undefined : {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});