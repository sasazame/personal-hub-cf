import { defineConfig, devices } from '@playwright/test';

/**
 * Minimal CI configuration for basic smoke tests
 * Optimized for speed and reliability
 */
export default defineConfig({
  testDir: './e2e',
  // Only run the minimal smoke tests and API health checks
  testMatch: ['ci-smoke.spec.ts', 'api-health.spec.ts'],
  
  // Fast timeouts
  timeout: 20 * 1000,
  expect: {
    timeout: 5000,
  },
  
  // CI optimizations
  fullyParallel: false, // Run tests sequentially for stability
  forbidOnly: true,
  retries: 1,
  workers: 1, // Single worker for reliability
  
  // Simple reporting
  reporter: process.env.CI ? 'github' : 'list',
  
  use: {
    // Base configuration
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    
    // Minimal tracing for speed
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    
    // Fast navigation
    navigationTimeout: 10000,
    actionTimeout: 5000,
    
    // Consistent viewport
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Headless mode for CI
        launchOptions: {
          args: [
            '--disable-gpu',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
          ]
        }
      },
    },
  ],

  // No webServer config - servers should be started externally
});