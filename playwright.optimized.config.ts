import { defineConfig, devices } from '@playwright/test';

/**
 * Optimized Playwright configuration for faster E2E test execution
 * Implements performance best practices to reduce test runtime
 */
export default defineConfig({
  testDir: './e2e',
  
  // Performance optimizations
  timeout: 20 * 1000, // Reduced timeout for faster failure detection
  expect: {
    timeout: 5000, // Fast expectation timeout
  },
  
  // Parallel execution settings
  fullyParallel: true, // Run tests in parallel
  forbidOnly: true,
  retries: process.env.CI ? 1 : 0, // Minimal retries
  workers: process.env.CI ? 4 : '80%', // Use available CPU cores efficiently
  
  // Efficient reporting
  reporter: process.env.CI 
    ? [['dot'], ['json', { outputFile: 'test-results.json' }]] // Minimal CI output
    : [['list'], ['html', { open: 'never' }]], // Detailed local output
  
  // Disable global setup for speed
  globalSetup: undefined,
  globalTeardown: undefined,
  
  use: {
    // Base configuration
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    
    // Minimal tracing for performance
    trace: 'off', // Disable tracing by default
    screenshot: 'off', // Disable screenshots by default
    video: 'off', // Disable video recording
    
    // Fast navigation settings
    navigationTimeout: 10000,
    actionTimeout: 5000,
    
    // Consistent viewport
    viewport: { width: 1280, height: 720 },
    
    // Network optimizations
    ignoreHTTPSErrors: true,
    bypassCSP: true, // Bypass Content Security Policy
    
    // Browser context optimizations
    locale: 'en-US',
    timezoneId: 'UTC',
    permissions: [], // No special permissions needed
    
    // Reduce animations
    reducedMotion: 'reduce',
    forcedColors: 'none',
  },

  projects: [
    {
      name: 'chromium-fast',
      use: { 
        ...devices['Desktop Chrome'],
        // Optimized browser launch options
        launchOptions: {
          args: [
            '--disable-gpu',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=IsolateOrigins',
            '--disable-site-isolation-trials',
            '--no-zygote',
            '--single-process', // Run in single process mode for speed
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-breakpad',
            '--disable-component-extensions-with-background-pages',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-renderer-backgrounding',
            '--force-color-profile=srgb',
            '--metrics-recording-only',
            '--no-first-run',
            '--disable-default-apps',
            '--mute-audio',
            '--no-default-browser-check',
            '--disable-hang-monitor',
            '--disable-prompt-on-repost',
            '--disable-sync',
            '--disable-domain-reliability',
            '--disable-client-side-phishing-detection',
            '--disable-component-update',
            '--disable-blink-features=AutomationControlled'
          ],
        },
        // Context optimizations
        contextOptions: {
          // Reduce resource usage
          javaScriptEnabled: true,
          bypassCSP: true,
          ignoreHTTPSErrors: true,
          // Disable service workers for speed
          serviceWorkers: 'block',
        }
      },
    },
  ],

  // Optimized web server configuration
  webServer: process.env.SKIP_WEBSERVER ? undefined : {
    command: 'pnpm dev:fast', // Use optimized dev server if available
    port: 3000,
    reuseExistingServer: true, // Always reuse existing server
    timeout: 60 * 1000,
    stdout: 'ignore', // Ignore server output for speed
    stderr: 'pipe',
  },

  // Test filtering for parallel execution
  grep: process.env.TEST_GREP ? new RegExp(process.env.TEST_GREP) : undefined,
  grepInvert: process.env.TEST_GREP_INVERT ? new RegExp(process.env.TEST_GREP_INVERT) : undefined,

  // Output configuration
  outputDir: 'test-results',
  preserveOutput: 'failures-only', // Only keep output for failed tests

  // Shard configuration for distributed testing
  shard: process.env.SHARD ? {
    total: parseInt(process.env.SHARD_TOTAL || '1'),
    current: parseInt(process.env.SHARD_CURRENT || '1'),
  } : undefined,
});