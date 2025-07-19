import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Optimized configuration for CI environment
 */
export default defineConfig({
  ...baseConfig,
  
  /* Use more workers in CI for parallel execution */
  workers: process.env.CI ? 4 : undefined,
  
  /* Shorter timeouts for CI */
  timeout: 30000,
  
  use: {
    ...baseConfig.use,
    /* Shorter action timeout */
    actionTimeout: 10000,
    /* Shorter navigation timeout */
    navigationTimeout: 15000,
    /* Disable animations for faster tests */
    launchOptions: {
      args: ['--disable-web-security'],
    },
    /* No video recording in CI */
    video: 'off',
  },
  
  /* Only test on Chromium in CI for speed */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...baseConfig.projects?.[0].use,
        /* Disable GPU for headless stability */
        launchOptions: {
          args: ['--disable-gpu', '--disable-dev-shm-usage'],
        },
      },
    },
  ],
  
  /* Simpler reporter for CI */
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',
});