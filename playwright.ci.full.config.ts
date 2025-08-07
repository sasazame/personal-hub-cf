import { defineConfig, devices } from '@playwright/test';

/**
 * Full CI Playwright configuration
 * Runs comprehensive tests for complete CI coverage
 * Used when we need thorough testing before deployment
 */
export default defineConfig({
  testDir: './e2e',
  // Include all critical feature tests
  testMatch: [
    'ci.spec.ts',
    'ci-critical.spec.ts',
    'auth-basic.spec.ts',
    'todo-basic.spec.ts',
    'notes.spec.ts',
    'calendar-basic.spec.ts',
    'goals.spec.ts',
    'moments.spec.ts',
    'pomodoro.spec.ts'
  ],
  timeout: 45 * 1000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: true,
  forbidOnly: true,
  retries: 2,
  workers: process.env.CI ? 4 : 8,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results.json' }]] : 'html',
  // Disable global setup in CI to avoid browser launch issues
  globalSetup: undefined,
  use: {
    actionTimeout: 10000,
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
          args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        }
      },
    },
    // Additional browsers for comprehensive testing
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          args: ['--no-sandbox']
        }
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        launchOptions: {
          args: ['--no-sandbox']
        }
      },
    },
  ],

  // Disable webServer in CI since we manually start servers
  webServer: process.env.SKIP_WEBSERVER ? undefined : {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});